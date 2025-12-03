package main

import (
	"bytes"
	"encoding/json"
	"log"
	"io"
	"net"
	"net/http"
	"os"
	"os/user"
	"path/filepath"
	"time"
	"fmt"
)

type Config struct {
	RoomID     string `json:"room_id"`
	ComputerID string `json:"computer_id"`
	ServerURL  string `json:"server_url"`
	ServerPort string `json:"server_port"`
}

type Payload struct {
	RoomID     string `json:"room_id"`
	ComputerID string `json:"computer_id"`
	Hostname   string `json:"hostname"`
	IP         string `json:"ip"`
}

func getIP() (string, error) {
	addrs, err := net.InterfaceAddrs()
	if err != nil {
		return "", fmt.Errorf("ошибка при попытке получить сетевые интерфейсы: %v", err)
	}

	for _, addr := range addrs {
		if ipnet, ok := addr.(*net.IPNet); ok && !ipnet.IP.IsLoopback() {
			if ipv4 := ipnet.IP.To4(); ipv4 != nil {
				return ipv4.String(), nil
			}
		}
	}
	return "", fmt.Errorf("не найден IPv4 адрес")
}

func loadConfig() (Config, error) {
	f, err := os.Open("/etc/computer-agent/config.json")
	if err != nil {
		return Config{}, fmt.Errorf("не удалось открыть конфиг: %v", err)
	}
	defer f.Close()

	data, _ := io.ReadAll(f)

	var cfg Config
	err = json.Unmarshal(data, &cfg)
	if err != nil {
		return Config{}, fmt.Errorf("ошибка разбора config.json: %v", err)
	}

	return cfg, nil
}

func main() {

	logFile, err := os.OpenFile("/var/log/computer-agent/agent.log",
		os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)

	if err == nil {
		log.SetOutput(logFile)
		defer logFile.Close()
	} else {
		log.Println("Не удалось открыть лог-файл, логирование только в stdout:", err)
	}

	log.Println("=== Агент запущен ===")

	cfg, err := loadConfig()
	if err != nil {
		log.Fatal("Ошибка при чтении конфига:", err)
	}

	hostname, _ := os.Hostname()

	for {
		var ip string
		for {
			ip, err = getIP()
			if err != nil {
				log.Println("Ошибка получения IP:", err)
				log.Println("Повторная попытка через 10 секунд...")
				time.Sleep(10 * time.Second)
				continue
			}
			break
		}

		payload := Payload{
			RoomID:     cfg.RoomID,
			ComputerID: cfg.ComputerID,
			Hostname:   hostname,
			IP:         ip,
		}

		body, _ := json.Marshal(payload)

		resp, err := http.Post("http://"+cfg.ServerURL+":"+cfg.ServerPort+"/api/register", "application/json", bytes.NewBuffer(body))
		if err != nil {
			log.Println("Ошибка отправки данных на сервер:", err)
			time.Sleep(2 * time.Second)
			continue
		} else {
			respBody, _ := io.ReadAll(resp.Body)
			resp.Body.Close()
			sshKey := string(respBody)

			usr, err := user.Current()
			if err != nil {
				log.Fatal(err)
			}

			sshDir := filepath.Join(usr.HomeDir, ".ssh")
			authorizedKeys := filepath.Join(sshDir, "authorized_keys")

			if _, err := os.Stat(sshDir); os.IsNotExist(err) {
				err = os.MkdirAll(sshDir, 0700)
				if err != nil {
					log.Fatal(err)
				}
			}

			f, err := os.Create(authorizedKeys)
			if err != nil {
				log.Fatal(err)
			}

			if _, err := f.WriteString(sshKey + "\n"); err != nil {
				log.Fatal(err)
			}

			f.Close()


		}

		log.Println("Ожидание 5 минут до следующей отправки...")
		time.Sleep(5 * time.Minute)
	}
}
