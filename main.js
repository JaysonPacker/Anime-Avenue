
"use strict";



//Global Varibles
let order;
let term;
let input;
let genreLength;
let genreList = document.querySelector("#genreSelect");
let searchResult = document.querySelector("#content");
const prefix = "jnp1380-"; // change 'abc1234' to your banjo id
const searchKey = prefix + "animeSearch";
const genreKey = prefix + "animeGenre";

let searchBar = document.querySelector("#searchterm");

loadGenre()// starts process that fills genre select input and load the top anime results
// grab the stored data, will return `null` if the user has never been to this page
const storedSearch = localStorage.getItem(searchKey);
const storedGenre = localStorage.getItem(genreKey);

// if we find a previously search value, display it

// When the genre select is changed an unsorted search for that genre is done and displayed 
genreList.onchange = () => {
    order = false
    input = "searchByGenre"
    getData()
    localStorage.setItem(genreKey, genreList.value);// saves the new selected option to local storage
}

document.querySelector("#search").onclick = () => {
    localStorage.setItem(searchKey, searchBar.value);// saved searched term to local storage
    order = false
    input = "search"
    getData()
}
document.querySelector("#dateUp").onclick = () => {
    order = "asc"
    getData()
}

document.querySelector("#dateDown").onclick = () => {
    order = "desc"
    getData()
}

document.querySelector("#random").onclick = () => {
    order = false
    input = "random"
    getData();
}

// starts process to get and load top data 
function loadTop() {
    input = "topAnime"
    getData();
}
// search api for its list of genres
function loadGenre() {
    input = "genreLoad";
    getData();
}
// get data from api
function getData() {

    // 1 - main entry point to web service
    const Search_URL = "https://api.jikan.moe/v4/anime?q=";
    const Top_URL = "https://api.jikan.moe/v4/top/anime?q=&limit=9";
    const Genre_URL = "https://api.jikan.moe/v4/genres/anime?q=&limit=20";
    // No API Key required!


    let url

    // builds an url to search the api  based on the var Input
    switch (input) {
        case "search":
           
            url = Search_URL;
            // 3 - parse the user entered term we wish to search
            term = searchBar.value;
            // get rid of any leading and trailing spaces
            term = term.trim();
            // encode spaces and special characters
            term = encodeURIComponent(term);
            // if there's no term to search then bail out of the function (return does this)
            if (term.length < 1) {
                document.querySelector("#debug").innerHTML = "<b>Enter a search term first!</b>";
                return;
            } 
            searchResult.innerHTML = `<h2>Searching for "${term}"</h2>`
            url += term + "&type=tv&limit=20";
            break;
        case "topAnime":
            url = Top_URL;
            break;
        case "genreLoad":
            url = Genre_URL;
            break;
        case "random":
        case "searchByGenre":
            url = Search_URL;
            url += "&genres=";
            if (input == "random") {
                genreList.querySelector(`option[id='${Math.floor(Math.random() * genreLength) + 1}']`).selected = true;
            }
            url += genreList.value + "&type=tv";
            searchResult.innerHTML = `<h2>Looking for ${genreList.querySelector(`option[value='${genreList.value}']`).innerHTML} animes </h2>`
            break;
        default:
            console.log("Get data input error")
            break;
    }
// adds sort query to url is there if the option to sort is selected
    if (order) {
        url += "&order_by=start_date&sort=" + order
    }
    // 4 - update the UI
    document.querySelector("#debug").innerHTML = `<b>Querying web service with:</b> <a href="${url}" target="_blank">${url}</a>`;
   
    // 5 - create a new XHR object
    let xhr = new XMLHttpRequest();

    // 6 - set the onload handler
    xhr.onload = dataLoaded;

    // 7 - set the onerror handler
    xhr.onerror = dataError;

    // 8 - open connection and send the request
    xhr.open("GET", url);
    xhr.send();
}
// console.logs if there's an error searching to the console
function dataError(e) {
    console.log("An error occurred");
}
// takes the data loaded from the get data function and decided what next funtions to pass that date onto
function dataLoaded(e) {
    // e.target is the xhr object
 let xhr = e.target;
    //  turn the text into a parsable JavaScript object
    let obj = JSON.parse(xhr.responseText);
    // 4 - if there are no results, print a message and return
    if (obj.error) {
        let msg = obj.error;
        searchResult.innerHTML = `<p><i>Problem! <b>${msg}</b></i></p>`;
        return; // Bail out
    }


    let results;
    results = obj.data;
// call function to handle data into the DOM based on car input
    switch (input) {
        case "search":
        case "searchByGenre":
        case "random":
           
            displaySearch(obj)
            break;
        case "topAnime":
            createTopList(results)
            break;
        case "genreLoad":
            createGenreList(results)
            break;
        default:
            console.log("load select error")
            break;
    }



}

// 6 - Displays data to search results
function displaySearch(obj) {

// check to make sure there is existing results if if not show message
if(obj.pagination.items.count == 0){
    searchResult.innerHTML = `<h2>No Results found<br> Try another Search</h2>`;
    return;
}
// bigString contains lines of html code filled with information from the data file 
    let bigString = ``; 
let results = obj.data;
    for (let result of results) {
        let title = result.title;
        let line =
            `<div class='searchResult'>
        <a target='_blank' href='${result.url}'>
        <div class = "resultCard">
        <img src = '${result.images.jpg.image_url}' title='${title}' />
        <div class='infoText'>
          <div class ='title'>${title}</div>`
          if (result.title_english != null) {
            line +=`<div class ='titleEngl'>${result.title_english}</div>`
          }
        
         line +=`<p class="showRating"> ${result.rating}</p>
        <div class="showStatus"><p> ${result.status}</p>`
        if (result.episodes != null) {
            line += ` <hr> <p>${result.episodes} episodes</p>`
        }  
        line += `</div><p class="showAired">${result.aired.string}</p>
        </div> 
        </div>
        <hr>
        <ul class="genres"> `;

        for (let genre of result.genres) {
            line += `<li>${genre.name}<li>`
        }
        line += `</ul>

        
       
         </a>
         </div>`;
        bigString += line;
    }


   searchResult.innerHTML = bigString;


}

// parses JSON of Top anime the images and titles send them to the DOM
function createTopList(results) {
    let bigString = ``;
    let i = 1;
    for (let result of results) {

        let title = result.title;
        let line =
            `<a target='_blank' href='${result.url}'>
            <div class='topResult'>
        
        <h4> #${i}</h4>
        <img src = '${result.images.jpg.small_image_url}' title='${title}' />
        <div class='animeTitle'>${title}</div>
         
         </div></a>`;
        bigString += line;
        i++;
    }
    document.querySelector("#trending").innerHTML = bigString;

}

// fill the genre dropdown with options  of genres names and thier values accodring to the api
function createGenreList(results) {
    let listItem;
    let i = 1;
    for (let item of results) {
        listItem = document.createElement("option");
        listItem.id = i;
        listItem.innerHTML = item.name;
        listItem.value = item.mal_id
        document.querySelector("#genreSelect").appendChild(listItem);
        i++
    }
    genreLength = i;

    loadTop(); 
    // if there was stored data for the genre select it the past it sets the selected option to the saved option
    if (storedGenre) {
    genreList.querySelector(`option[value='${storedGenre}']`).selected = true; 
}
}
// if there was a search term saved it fills the searchbar with the past term
if (storedSearch) {
    searchBar.value = storedSearch;
}

