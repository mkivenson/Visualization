const table_output = document.querySelector("tbody")
const pres_input = document.querySelector("#pres_input").value;
const submit_button_pres = document.querySelector("#pres_button");
const pres_output = document.querySelector("h4");


var pres_lookup = [];
var pres_list = [];

function process_row(data) { // for each row
    var row = '';
    for (const i in data){
        row = row + `<td>${data[i]}</td>`
        pres_lookup.push(data[i])
    }
    row = `<tr>${row}</tr>`
    pres_list.push(data)
    table_output.innerHTML = table_output.innerHTML + row
}

const d = {
    hello: 'world',
    drink: 'juice'
};

d3.csv(
    "https://raw.githubusercontent.com/mkivenson/Visualization/master/module5/data/presidents.csv", 
    process_row
);


function getheight(pres) {
    // return data["Height"][pres]
}

submit_button_pres.onclick = function(){
    console.log([pres_list][0][pres_input])
    /*output_rev.innerText = reverseString(input_field_rev.value)*/
};