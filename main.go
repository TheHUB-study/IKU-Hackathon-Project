package main

import (
	"fmt"
	"html/template"
	"log"
	"os"
	"sync"
)

type page struct {
	Page 	string
	Title 	string
	Data 	any
}

var tpl *template.Template
var wg sync.WaitGroup

// Used for any helper functions we implement within the main file
func init() {

	tpl = template.Must(template.New("").ParseGlob("./templates/*.gohtml"))
	wg.Add(0)
	wg.Wait()

}

func main() {

	createPageFromTemplate("index", page{
		Page:  "index",
		Title: "Home Hub",
	})

	createPageFromTemplate("my-calendar", page{
		Page:  "my-calendar",
		Title: "Calendar Hub",
	})

	createPageFromTemplate("my-course", page{
		Page:  "my-course",
		Title: "Course Hub",
	})

	createPageFromTemplate("my-learning", page{
		Page:  "my-learning",
		Title: "Learning Hub",
	})

	createPageFromTemplate("my-societies", page{
		Page:  "my-societies",
		Title: "Societies Hub",
	})

}

func createPageFromTemplate(name string, page page) {
	new_file, err := os.Create(fmt.Sprintf("%s.html", name))
	if err != nil {
		log.Fatal(err)
	}
	defer new_file.Close()
	err = tpl.ExecuteTemplate(new_file, fmt.Sprintf("%s.gohtml", name), page)
}


// Helper functions go here 