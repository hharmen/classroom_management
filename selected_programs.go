package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os/exec"
)

type Computer struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

type App struct {
	ID      int    `json:"id"`
	Name    string `json:"name"`
	Version string `json:"version"`
}

type Payload struct {
	Computers []Computer `json:"computers"`
	Apps      []App      `json:"apps"`
}

func handleJSON(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Метод не поддерживается", http.StatusMethodNotAllowed)
		return
	}

	var payload Payload

	err := json.NewDecoder(r.Body).Decode(&payload)
	if err != nil {
		http.Error(w, "Ошибка при разборе JSON: "+err.Error(), http.StatusBadRequest)
		return
	}

	db, err := sql.Open("sqlite3", "./computers.db")
	if err != nil {
		log.Fatal(err)
	}

	for i := 0; i < len(payload.Computers); i++ {
		for j := 0; j < len(payload.Apps); j++ {

			var roomName string
			query := `
			SELECT r.room_name
			FROM computers c
			JOIN rooms r ON c.room_id = r.id
			WHERE c.id = ?
    		`

			err := db.QueryRow(query, payload.Computers[i].ID).Scan(&roomName)
			if err != nil {
				return
			}

			cmd := exec.Command("ansible-playbook", "-i", "hosts.ini", "install_apps.yml", "-e", fmt.Sprintf("\"target_hosts=%s-%s\"", payload.Computers[i], roomName), "-e", fmt.Sprintf("install_programs={'%s':'%s'}", payload.Apps[j].Name, payload.Apps[j].Version))

			err = cmd.Run()
			if err != nil {
				log.Fatal(err)
			}
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"status": "успешно получено",
	})
}

func main() {
	http.HandleFunc("/save_selected", handleJSON)
	fmt.Println("Сервер запущен на :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
