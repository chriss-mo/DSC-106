const form = document.querySelector('form');

form?.addEventListener('submit', (event) => {
    event.preventDefault();

    const data = new FormData(form);

    let url = form.action + '?';
    for (let [name, value] of data) {
        // url += `${encodeURIComponent(name)}=${encodeURIComponent(value)}&`;
        console.log(name, value);
    }
    
    location.href = url;
});
