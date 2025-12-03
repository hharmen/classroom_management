package main

import (
    "encoding/json"
    "io/ioutil"
    "log"
    "net/http"
)

type App_get struct {
    ID          int    `json:"id"`
    Name        string `json:"name"`
    Version     string `json:"version"`
    Description string `json:"description"`
    Size        string `json:"size"`
    Icon        string `json:"icon"`
    Selected    bool   `json:"selected"`
}

func AppsHandler(w http.ResponseWriter, r *http.Request) {



    data, err := ioutil.ReadFile("apps.json")
    if err != nil {
        log.Printf("Error reading file: %v", err)
        http.Error(w, "Internal server error", http.StatusInternalServerError)
        return
    }

    var apps []App_get
    if err := json.Unmarshal(data, &apps); err != nil {
        log.Printf("Error unmarshaling JSON: %v", err)
        http.Error(w, "Invalid JSON format", http.StatusInternalServerError)
        return
    }

    w.WriteHeader(http.StatusOK)
    w.Write(data)
}
