package main

import (
	"bufio"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/user"
)

type RequestData struct {
	RoomID     string `json:"room_id"`
	ComputerID string `json:"computer_id"`
	Hostname   string `json:"hostname"`
	IP         string `json:"ip"`
}

type Response struct {
	sshKey string `json:"ssh_key"`
}

func AddComputer(db *sql.DB, roomID int, roomName, name, ip string) error {
	query := `
        INSERT INTO computers (room_id, room_name, computer_name, ip, last_seen)
        VALUES (?, ?, ?, ?, datetime('now'))
        ON CONFLICT(room_id, computer_name) DO UPDATE SET
            ip = excluded.ip,
            last_seen = datetime('now'),
            room_name = excluded.room_name;
    `
	_, err := db.Exec(query, roomID, roomName, name, ip)
	return err
}

func UpdateIni(db *sql.DB) error {
	query := `SELECT room_name, computer_name, ip FROM computers`

	rows, err := db.Query(query)
	if err != nil {
		return err
	}
	defer rows.Close()

	computers := ""

	for rows.Next() {
		var RoomName, ComputerName, IP string
		if err := rows.Scan(&RoomName, &ComputerName, &IP); err != nil {
			return err
		}
		computers = computers + fmt.Sprintf("%s-%s ansible_host=%s ansible_user=root\n", RoomName, ComputerName, IP)
	}
	err = os.WriteFile("....", []byte(computers), 0644)
	if err != nil {
		log.Fatal(err)
	}
	if err := rows.Err(); err != nil {
		return err
	}

	return nil
}

func AddRoom(db *sql.DB, name string) error {
	query := `INSERT INTO rooms (room_name) VALUES (?)`
	_, err := db.Exec(query, name)
	return err
}

func handler_reg(w http.ResponseWriter, r *http.Request) {
	var data RequestData
	err := json.NewDecoder(r.Body).Decode(&data)
	if err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	currentUser, err := user.Current()

	sshKeyPath := fmt.Sprintf("/home/%s/.ssh/ed25519.pub", currentUser.Username)

	file, err := os.Open(sshKeyPath)
	if err != nil {
		log.Fatalf("не удалось открыть файл с ключом: %s", err)
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	scanner.Split(bufio.ScanWords)

	if scanner.Scan() {
		key := scanner.Text()
		response := Response{
			sshKey: key,
		}
		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(response); err != nil {
			return
		}
		db, err := sql.Open("sqlite3", "./computers.db")
		if err != nil {
			log.Fatal(err)
		}
		defer db.Close()
		AddRoom(db, data.RoomID)

		var roomID int
		db.QueryRow(`SELECT id FROM rooms WHERE room_name = ?`, data.RoomID).Scan(&roomID)
		if err := AddComputer(db, roomID, data.RoomID, data.Hostname, data.IP); err != nil {
			return
		}

		if err := UpdateIni(db); err != nil {
			log.Printf("ошибка обновления списка компьютеров: %s", err)
		}

	}

	if err := scanner.Err(); err != nil {
		log.Fatalf("ошибка сканирования файла с ключом: %s", err)
	}

}

func main() {
	http.HandleFunc("/api/register", handler_reg)
	log.Fatal(http.ListenAndServe(":8080", nil))
}
