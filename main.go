package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
)

func main() {
	db, err := sql.Open("sqlite3", "./computers.db")
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	http.HandleFunc("/sync_rooms", RoomsHandler(db))
	http.HandleFunc("/save_selected", handle_select)
	http.HandleFunc("/api/register", handler_reg)

	fmt.Println("Server started on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
