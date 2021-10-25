// create variable to hold db connection
let db;
// establish a connection to IndexedDB database called 'budget_tracker' and set it to version 1
const request = indexedDB.open('budget_tracker', 1);

// this event will emit if the database version changes (nonexistant to version 1, v1 to v2, etc.)
request.onupgradeneeded = function(event) {
    // save a reference to the database 
    const db = event.target.result;
    // create an object store (table) called `new_transfer`, set it to have an auto incrementing primary key of sorts 
    db.createObjectStore('new_transfer', { autoIncrement: true });
};

// upon a successful 
request.onsuccess = function(event) {
    // when db is successfully created with its object store (from onupgradedneeded event above) or simply established a connection, save reference to db in global variable
    db = event.target.result;
  
    // check if app is online, if yes run uploadTransfer() function to send all local db data to api
    if (navigator.onLine) {
      uploadTransfer();
    }
};

request.onerror = function(event) {
    // log error here
    console.log(event.target.errorCode);
};

// if there's no internet connection, save transfer info to an object on indexedDb, which can be found on dev tools application tab
function saveRecord(record) {
    // open a new transaction with the database with read and write permissions 
    const transaction = db.transaction(['new_transfer'], 'readwrite');
  
    // access the object store for `new_transfer`
    const transferObjectStore = transaction.objectStore('new_transfer');
  
    // add record to your store with add method
    transferObjectStore.add(record);
}

function uploadTransfer() {
    // open a transaction on your db
    const transaction = db.transaction(['new_transfer'], 'readwrite');
  
    // access your object store
    const transferObjectStore = transaction.objectStore('new_transfer');
  
    // get all records from store and set to a variable
    const getAll = transferObjectStore.getAll();
  
    // upon a successful .getAll() execution, run this function
    getAll.onsuccess = function() {
        // if there was data in indexedDb's store, let's send it to the api server
        if (getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),//getAll.result is an array of all the data retrieved from indexedDb
                headers: {
                Accept: 'application/json, text/plain, */*',
                'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
            if (serverResponse.message) {
                throw new Error(serverResponse);
            }
            // open one more transaction
            const transaction = db.transaction(['new_transfer'], 'readwrite');
            // access the new_transfer object store
            const transferObjectStore = transaction.objectStore('new_transfer');
            // clear all items in your store
            transferObjectStore.clear();

            alert('All saved transfers have been submitted!');
            })
            .catch(err => {
            console.log(err);
            });
        }
    };
}

window.addEventListener('online', uploadTransfer);