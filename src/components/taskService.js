const todoAPIEndpoint = "http://localhost:9090/api/todo";
const todoOverdueAPIEndpoint = "http://localhost:9090/api/todo/overdue";
const todoStatusTrueAPIEndpoint = "http://localhost:9090/api/todo/status?completed=true";
const todoStatusFalseAPIEndpoint = "http://localhost:9090/api/todo/status?completed=false";
const personAPIEndpoint = "http://localhost:9090/api/person";
const tasksByPersonAPIEndpoint = "http://localhost:9090/api/todo/person";

import axios from "axios";

export function checkFilter(filter, token) {
    console.log("current filter: ", filter);
    switch(filter) {
        case "Overdue" :
            return fetchFilteredTodoTasks(todoOverdueAPIEndpoint, token);
        case "InProgress":
            return fetchFilteredTodoTasks(todoStatusFalseAPIEndpoint, token);
        case "Complete":
            return fetchFilteredTodoTasks(todoStatusTrueAPIEndpoint, token);
        case "NoFiltering":
            return fetchFilteredTodoTasks(todoAPIEndpoint, token);
        default:
            return fetchFilteredTodoTasks(todoAPIEndpoint, token);
    }
}

async function fetchFilteredTodoTasks (endpoint, token) {
    console.log(`### Starting to fetch todo tasks...`);

    let returnValue = [];
    await axios
    .get(endpoint, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then((response) => {
        console.log("Response:", response);
        if (response.status === 200) {
            returnValue = response.data;
        } else {
            console.log("Unexpected reponse status:", response.status);
        }
    })
    .catch((error) => {
        console.log("Unexpected occured during API call:", error);
    });
    console.log("### finished fetching todo tasks.");
    return returnValue;
}

export async function fetchAllUsers(token) {
    console.log(`### Starting to fetch users...`);
    
    let returnValue = [];
    await axios
    .get(personAPIEndpoint, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then((response) => {
        console.log("Response:", response);
        if (response.status === 200) {
            returnValue = response.data;
        } else {
            console.log("Unexpected reponse status:", response.status);
        }
    })
    .catch((error) => {
        console.log("Unexpected occured during API call:", error);
    });
    console.log("### finished fetching all users.");
    return returnValue;
}

export async function fetchTasksFromSpecificUser(id, token) {
    console.log(`### Starting to fetch task from user, `, id);

    let returnValue = [];
    await axios
    .get(`${tasksByPersonAPIEndpoint}/${id}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then((response) => {
        console.log("Response:", response);
        if (response.status === 200) {
            returnValue = response.data;
        } else {
            console.log("Unexpected reponse status:", response.status);
        }
    })
    .catch((error) => {
        console.log("Unexpected occured during API call:", error);
    });
    console.log("### finished fetching task from specific user.");
    return returnValue;
}

//onSubmit
export async function sendNewTodo(data, token) {
    console.log("### Starting to send the new task to backend...")
    
    // Merhdad added multipart/form-data for file attachments and this is required to package the request correctly. 
    // FormData.append adds the data to the key, it doesn't remove the exist data that key has which is why we can append multiple time on the same key.
    // We must append each file separately, appending the entire file list doesn't work, each file must be appended on the same key separately.

    // WFor out back-end, adding the files in a Blob as we do the rest of the data doesn't work, it won't get the right data.
    // So while it works for the rest of the data to make a blob and add the type of data to it, for the files we need to
    // add the content-type in the header.

    const newData = createFormData(data);

    let returnValue = false;
    await axios({
            method: 'post',
            url: todoAPIEndpoint,
            data: newData,
            headers: {
                'Authorization': `Bearer ${token}`,
                "Content-type": "multipart/form-data"
            }
        }).then(function(response) {
            if (response.status === 201) {
                console.log("Todo task created successfully");
                returnValue = true;
            } else {
                console.log("Unexpected reponse status:", response.status);    
            }
    }).catch(function (response) {
        console.log("Error creating todo task;", response);
    });
    return returnValue;
}

export async function removeTodo(id, token) {
    console.log(`### Starting deleting todo task with id ${id}...`);
    let returnValue = false;

    try{
        const response = await axios.delete(
            `${todoAPIEndpoint}/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        if (response.status === 204) {
            console.log("Todo task deleted successfully.");
            returnValue = true;
        } else if(response.status === 404) {
            console.log("Task not found");
        } else {
            console.log("Unexpected reponse status:", response.status);   
        }
    } catch(error) {
       console.log("Error removing todo task;", error);
    }
    return returnValue;
}

 // Updates the editied todo in the back-end
export async function updateTodo(id, data, token) {
    console.log("### Starting updated task...")

    
    const newData = createFormData(data);
    
    let returnValue = false;
    await axios({
        method: 'put',
        url: `${todoAPIEndpoint}/${id}`,
        data: newData,
        headers: {
            'Authorization': `Bearer ${token}`
        }
    }).then(function(response) {
        if (response.status === 200) {
            console.log("Todo task updated successfully");
            returnValue = true;
        } else if(response.status === 404) {
            console.log("Task not found");
        } else {
            console.log("Unexpected reponse status:", response.status)
        }
    }).catch(function (response) {
        console.log("Error updating todo task;", response);
    });
    return returnValue;
}

function createFormData(data ){
    const newData = new FormData();

    if (data.attachments !== undefined && data.attachments.length > 0) {
        for(let i = 0; i < data.attachments.length; i++) {
            newData.append("files", data.attachments[i]);
        }
    }

    data.attachments = [];
    data.nrOfAttachments = 0;
    const json = JSON.stringify(data);
    const todo = new Blob([json], {
        type: 'application/json'
    });

    newData.append("todo", todo);

    return newData;
}