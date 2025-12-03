package main

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"os/exec"
	"fmt"

	_ "github.com/mattn/go-sqlite3"
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

func handleSelect(w http.ResponseWriter, r *http.Request) {

	var payload Payload

	err := json.NewDecoder(r.Body).Decode(&payload)
	if err != nil {
		http.Error(w, "Ошибка при разборе JSON: "+err.Error(), http.StatusBadRequest)
		log.Fatal(err)
	}

	db, err := sql.Open("sqlite3", "./computers.db")
	if err != nil {
		log.Fatalf("Ошибка открытия бд: %s", err)
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
				log.Fatalf("Ошибка чтения строк в бд: %s", err)	
			}

			cmd := exec.Command("ansible-playbook", "-i", "/opt/myserver/ansible/hosts.ini", "/opt/myserver/ansible/install_apps.yml", "--tags", payload.Apps[j].Name, "--limit", fmt.Sprintf("%s-%s", roomName, payload.Computers[i].Name))

			err = cmd.Run()
			if err != nil {
				log.Fatalf("Ошибка запуска программы : %s %s", err, cmd.String())
			}
		}
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"status": "успешно получено",
	})
}
