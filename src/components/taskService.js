const todoAPIEndpoint = "http://localhost:9090/api/todo";
const todoOverdueAPIEndpoint = "http://localhost:9090/api/todo/overdue";
const todoStatusTrueAPIEndpoint = "http://localhost:9090/api/todo/status?completed=true";
const todoStatusFalseAPIEndpoint = "http://localhost:9090/api/todo/status?completed=false";
const personAPIEndpoint = "http://localhost:9090/api/person";

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

//onSubmit
export async function sendNewTodo(data, token) {
    console.log("### Starting to send the new task to backend...")
    
    // Merhdad added multipart/form-data for file attachments and this is required to package the request correctly. 
    const file = data.attachments;
    data.attachments = [];
    const json = JSON.stringify(data);
    const blob = new Blob([json], {
        type: 'application/json'
    });
    const newData = new FormData();
    newData.append("todo", blob);
    newData.append("files", file);

    let returnValue = false;
    await axios({
            method: 'post',
            url: todoAPIEndpoint,
            data: newData,
            headers: {
                'Authorization': `Bearer ${token}`
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

    const file = data.attachments;
    data.attachments = [];
    const json = JSON.stringify(data);
    const blob = new Blob([json], {
        type: 'application/json'
    });
    const newData = new FormData();
    newData.append("todo", blob);
    newData.append("files", file);
    
    let returnValue = false;
    await axios({
        method: 'put',
        url: `${apiEndpoint}/${id}`,
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