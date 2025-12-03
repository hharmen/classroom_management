package main

import (
	"database/sql"
	"log"
	"net/http"
	"os"
)

func main() {
	logFile, _ := os.OpenFile("/home/hkeee/server.log",
		os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	log.SetOutput(logFile)
	db, err := sql.Open("sqlite3", "./computers.db")
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	http.HandleFunc("/get_rooms", RoomsHandler(db))
	http.HandleFunc("/receive_selected", handleSelect)
	http.HandleFunc("/api/register", handlerReg)
	http.HandleFunc("/get_apps", AppsHandler)

	if err = http.ListenAndServe(":6000", nil); err != nil{
		log.Fatal(err)
	}
}
