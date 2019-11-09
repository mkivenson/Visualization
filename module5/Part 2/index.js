const table_output = document.querySelector("tbody")

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


d3.csv(
    "https://raw.githubusercontent.com/mkivenson/Visualization/master/module5/data/presidents.csv", 
    process_row
);

submit_button_pres.onclick = function(){
    let has_found = 0
        for (const n of pres_list){
            if (n['Name'] == document.querySelector("#pres_input").value){
                has_found = 1
                pres_output.innerText = `Height: ${n['Height']}  Weight: ${n['Weight']}`
                console.log('here', pres_input, n['Name']);
            }
        }
    if (has_found == 0){
        pres_output.innerText = `Not a valid selection!!!`
    }
};