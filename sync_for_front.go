package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"

	_ "github.com/mattn/go-sqlite3"
)

type FileInfo struct {
	Name   string `json:"name"`
	Size   string `json:"size"`
	Status string `json:"status"`
	Type   string `json:"type"`
}

type ComputerInfo struct {
	Expanded   bool       `json:"expanded"`
	Files      []FileInfo `json:"files"`
	ID         int        `json:"id"`
	IP         string     `json:"ip"`
	LastActive string     `json:"lastActive"`
	Name       string     `json:"name"`
	Status     string     `json:"status"`
}

type RoomInfo struct {
	Code      string         `json:"code"`
	Computers []ComputerInfo `json:"computers"`
	Expanded  bool           `json:"expanded"`
	ID        int            `json:"id"`
	Name      string         `json:"name"`
}

func GetAllRooms(db *sql.DB) ([]RoomInfo, error) {
	rows, err := db.Query(`SELECT id, room_name FROM rooms`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var rooms []RoomInfo

	for rows.Next() {
		var r RoomInfo
		err := rows.Scan(&r.ID, &r.Name)
		if err != nil {
			return nil, err
		}

		r.Expanded = false
		r.Code = fmt.Sprintf("%d", r.ID)

		rooms = append(rooms, r)
	}

	return rooms, nil
}

func GetComputersByRoomID(db *sql.DB, roomID int) ([]ComputerInfo, error) {
	rows, err := db.Query(`
        SELECT id, computer_name, ip, last_seen
        FROM computers
        WHERE room_id = ?
    `, roomID)

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []ComputerInfo

	for rows.Next() {
		var c ComputerInfo
		var lastSeen sql.NullString

		err := rows.Scan(&c.ID, &c.Name, &c.IP, &lastSeen)
		if err != nil {
			return nil, err
		}

		c.Expanded = false
		c.Status = "online"
		c.Files = []FileInfo{}
		c.LastActive = lastSeen.String

		list = append(list, c)
	}

	return list, nil
}

func BuildTree(db *sql.DB) ([]RoomInfo, error) {
	rooms, err := GetAllRooms(db)
	if err != nil {
		return nil, err
	}

	for i := range rooms {
		comps, err := GetComputersByRoomID(db, rooms[i].ID)
		if err != nil {
			return nil, err
		}

		rooms[i].Computers = comps
	}

	return rooms, nil
}

func RoomsHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {

		data, err := BuildTree(db)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(data)
	}
}
