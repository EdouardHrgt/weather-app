const input = document.querySelector("#search");
const form = document.querySelector("#myForm");
const submit = document.querySelector("#submit");
const units = document.querySelector('.units');
let search;

input.addEventListener("input", myValue);

function myValue(e) {
  search = e.target.value;
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
});
