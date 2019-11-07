const input_field_rev = document.querySelector("#rev");
const submit_button_rev = document.querySelector("#rev_button");
const output_rev = document.querySelector("h4");

function reverseString(str) {
    return str.split("").reverse().join("");
}

submit_button_rev.onclick = function(){
    output_rev.innerText = reverseString(input_field_rev.value)
};

const input_field_mult = document.querySelector("#mult");
const submit_button_mult = document.querySelector("#mult_button");
const output_mults = document.querySelectorAll("td")

submit_button_mult.onclick = function(){
    for (let i = 0; i < 20; i++){
        output_mults[i].innerText = input_field_mult.value * (i+1)
    }
};