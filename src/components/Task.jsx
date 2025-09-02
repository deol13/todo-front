import React, { useEffect, useMemo, useState } from 'react';
import './Task.css';
import Sidebar from './Sidebar';
import Header from "./Header.jsx";
import { useForm } from "react-hook-form"
import axios from "axios";
import { todoAPIEndpoint as apiEndpoint, todoOverdueAPIEndpoint as overDueApiEndPoint,
    todoStatusTrueAPIEndpoint as completeApiEndpoint, todoStatusFalseAPIEndpoint as InprogressApiEndpoint
 } from "./APIs";
import { useAuth } from '../context/AuthContext';


//TODO: Lägg till en ny API i back-end som hämtar endast user role personer
//  sen använd den i front-end i form person select och edit card person select.
//TODO: Lägg till mera kommentarer.
//TODO: separera denna komponenten till flera mindre.

const Task = () => {
    const {
        register,
        handleSubmit,
        reset,
        formState: {errors},
    } = useForm({
        defaultValues: {
        title: "",
        description: "",
        completed: "false",
        createdAt: "",
        updatedAt: "",
        dueDate: "",
        personId: "",
        attachments: [],
        },
    }); 

    const { token, hasRole } = useAuth();
    const [todoTasks, setTodoTasks] = useState([]);
    // True means sorting by earliest dueDate, false means sorting by latest dueDate.
    const [sortByEarliest, setSortByEarliest] = useState(true);
    const [filter, setFilter] = useState("NoFiltering");
    const [editTodo, setEditTodo] = useState(false);
    const [editTodoId, setEditTodoId] = useState("");

    // On refresh and when an array is changed this useEffect is called.
    useEffect(() => {
        console.log("useEffect has been executed!");
        checkFilter();
    }, [filter]);

    const checkFilter = () => {
        console.log("current filter: ", filter);
        switch(filter) {
            case "Overdue" :
                fetchFilteredTodoTasks(overDueApiEndPoint);
                break;
            case "InProgress":
                fetchFilteredTodoTasks(InprogressApiEndpoint);
                break;
            case "Complete":
                fetchFilteredTodoTasks(completeApiEndpoint);
                break;
            case "NoFiltering":
                fetchFilteredTodoTasks(apiEndpoint);
                break;
            default:
                fetchFilteredTodoTasks(apiEndpoint);
                break;
        }
    }

    const fetchFilteredTodoTasks = async (endpoint) => {
        console.log(`### Starting to fetch ${endpoint} todo tasks...`);

        await axios
        .get(endpoint, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then((response) => {
            console.log("Response:", response);
            if (response.status === 200) {
                setTodoTasks(response.data);
            } else {
                console.log("Unexpected reponse status:", response.status);
            }
        })
        .catch((error) => {
            console.log("Unexpected occured during API call:", error);
        });
        console.log("### finished fetching todo tasks.");
    }

    const onSubmit = async (data) => {
        console.log("### Starting to send the new task to backend...")
        
        // form hook library doesn't seem to have a validation for file type so this is my custom valiation.
        const passedFileValidation = fileValidation(data.attachments);
        if(!passedFileValidation) {
            console.log("File validation failed.");
            return;
        };

        console.log("file validation succeded")
        
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
        //console.log(data);

        await axios({
                method: 'post',
                url: apiEndpoint,
                data: newData,
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }).then(function(response) {
                if (response.status === 201) {
                    reset();
                    console.log("Todo task created successfully");
                    checkFilter();
                }
            }).catch(function (response) {
                console.log("Error creating todo task;", response);
            });
    }

    const fileValidation = (files) => {
        // form hook library doesn't seem to have a validation for file type so this is my custom valiation.
        if(files.length > 5) {
            alert("Maximum number of files are 5");
            return false;
        } else {
            for(let i = 0; i < files.length; i++) {
                if(files[i].size > 2097152) {
                    alert("Maximum size of a file is 2MB");
                    return false;
                }
            }
        }
        return true;
    }

    // When I use onClick{clickedRemoveTodo(todo.id)} clickedRemoveTodo is automatically called, I need to pass a reference to the function instead.
    // Which is why I use onClick{() => clickedRemoveTodo(todo.id)}
    const clickedRemoveTodo = (id) => {
        removeTodo(id);
    }

    const removeTodo = async (id) => {
         console.log(`### Starting deleting todo task with id ${id}...`)   
        try{
            const response = await axios.delete(
                `${apiEndpoint}/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            if (response.status === 204) {
                console.log("Todo task deleted successfully.");
                checkFilter();
            } else if(response.status === 404) {
                console.log("Task not found")
            } else {
                console.log("Unexpected reponse status:", response.status);    
            }
        } catch(error) {
           console.log("Error creating todo task;", error)
        }
    }
    
    //sort by dueDate, Memo will only recompute the memorized value when one of the depoendencies has changed. 
    const sortByDate = useMemo(() => {
        console.log("Sort");
        if(sortByEarliest)
            todoTasks.sort((a, b) => a.dueDate > b.dueDate ? 1 : -1 );
        else
            todoTasks.sort((a, b) => a.dueDate > b.dueDate ? -1 : 1 );
    }, [todoTasks, sortByEarliest])
    
    const changeSort = () => {
        console.log("Change sort");
        setSortByEarliest(sortByEarliest === true ? false : true);
    }

    const changeFilter = (event) => {
        console.log("change filter");
        setFilter(event.target.value);
    }

    // Contains the values during edit mode.
    const [titleEditValue, setTitleEditValue]= useState("");
    const [descEditValue, setDescEditValue]= useState("");
    const [dueDateEditValue, setDueDateEditValue]= useState("");
    const [personEditValue, setPersonEditValue]= useState("");
    const [statusEditValue, setStatusEditValue]= useState("");
    let createdAtValue = "";
    let updatedAtValue = "";
    let attachmentsValue = "";

    const startEditTodo = (id) => {
        // If one todo is already being edit stop another one from starting.
        if(!editTodo) {
            console.log("start edit todo")
            setEditTodo(true);
            setEditTodoId(id);

            const currentTodo = todoTasks.find((todo) => todo.id === id);

            setTitleEditValue(currentTodo.title);
            setDescEditValue(currentTodo.description);
            setDueDateEditValue(currentTodo.dueDate);
            setPersonEditValue(currentTodo.personId);
            setStatusEditValue(currentTodo.completed);
            createdAtValue = currentTodo.createdAt;
            updatedAtValue = currentTodo.updatedAt;
            attachmentsValue = currentTodo.attachmentsValue;

            console.log("STATUS BEFORE EDIT: ", currentTodo.completed)
        }
    }
    const endEditTodo = (id) => {
        // So nothing gets done before edit button is clicked.
        if(editTodo) {
            console.log("end edit todo")
            setEditTodo(false);
            setEditTodoId("")

            // If nothing was changed then its unnecessary to update todo in the back-end.
            const update = checkForChanges(id);

            if(update) {
                const data = {
                    "id": id,
                    "title": titleEditValue,
                    "description": descEditValue,
                    "completed": statusEditValue,
                    "createdAt": createdAtValue,
                    "updatedAt": updatedAtValue,
                    "dueDate": dueDateEditValue,
                    "personId": personEditValue,
                    "numberOfAttachments": 0,
                    "attachments": attachmentsValue
                }

                updateTodo(id, data);
            } else {
                console.log("No changes, not updating")
            }
        }
    }

    // Updates the editied todo in the back-end
    const updateTodo = async (id, data) => {
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
        //console.log(data);

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
                    checkFilter();
                } else if(response.status === 404) {
                console.log("Task not found")
                } else {
                    console.log("Unexpected reponse status:", response.status);
                }
            }).catch(function (response) {
                console.log("Error updating todo task;", response);
            });
    }

    // Used in edit mode to set the new values for the todo
    const changeTitle = (event) => {
        setTitleEditValue(event.target.value);
    }
    const changeDescription = (event) => {
        setDescEditValue(event.target.value);
    }
    const changeDueDate = (event) => {
        setDueDateEditValue(event.target.value);
    }
    const changePerson = (event) => {
        setPersonEditValue(event.target.value);
    }
    const changeStatus = (event) => {
        setStatusEditValue(event.target.value);
    }

    // Checks if anything was updated in edit mode.
    const checkForChanges = (id) => {
        const currentTodo = todoTasks.find((todo) => todo.id === id);

        if(currentTodo.title !== titleEditValue) {
            return true;
        } else if(currentTodo.description !== descEditValue) {
            return true;
        } else if(currentTodo.dueDate !== dueDateEditValue) {
            return true;
        } else if(currentTodo.personId !== personEditValue) {
            return true;
        } else if(currentTodo.completed !== statusEditValue) {
            return true;
        }
        return false;
    }
    

    // Used to remove time from dates.
    const removeTime = (date) => {
        if(date === undefined || date === null ||date === "") return "";
        let dateTime = date.split('T');
        return dateTime[0];
    }

    return (
        <div className="dashboard-layout">
            <Sidebar isOpen={false} onClose={() => {}} />
            <main className="dashboard-main">
                <Header
                    title="Tasks"
                    subtitle="Manage and organize your tasks"
                    onToggleSidebar={() => {}}
                />

                <div className="dashboard-content">
                    <div className="row">
                        <div className="col-md-8 mx-auto">
                            <div className="card shadow-sm task-form-section">
                                <div className="card-body">
                                    <h2 className="card-title mb-4">Add New Task</h2>
                                    <form id="todoForm" onSubmit={handleSubmit(onSubmit)}>
                                        <div className="mb-3">
                                            <label htmlFor="todoTitle" className="form-label">Title</label>
                                            <input type="text" className={`form-control ${errors.title ? "is-invalid" : ""}`} id="todoTitle"
                                            {...register("title", {
                                                required: "Title is required!",
                                                minLength: {
                                                    value: 2,
                                                    message: "Title must be at leasty 2 characters"
                                                },
                                                maxLength: {
                                                    value: 100,
                                                    message: "Title can't be more than 100 characters",
                                                },
                                            })} />
                                            {errors.title && (
                                                <div className="invalid-feedback">{errors.title.message}</div>
                                            )}
                                        </div>
                                        <div className="mb-3">
                                            <label htmlFor="todoDescription" className="form-label">Description</label>
                                            <textarea className={`form-control ${errors.description ? "is-invalid" : ""}`} id="todoDescription" rows="3"
                                            {...register("description", {
                                                maxLength: {
                                                    value: 500,
                                                    message: "Description can't be more than 500 characters"
                                                }
                                            })}
                                            ></textarea>
                                            {errors.description && (
                                                <div className="invalid-feedback">{errors.description.message}</div>
                                            )}
                                        </div>
                                        <div className="row">
                                            <div className="col-md-6 mb-3">
                                                <label htmlFor="todoDueDate" className="form-label">Due Date</label>
                                                <input type="datetime-local" className="form-control" id="todoDueDate" 
                                                {...register("dueDate")}/>
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                <label htmlFor="todoPerson" className="form-label">Assign to Person</label>
                                                <select className="form-select" id="todoPerson"
                                                {...register("personId")}>
                                                    <option value="">-- Select Person (Optional) --</option>
                                                    <option value="1">Mehrdad Javan</option>
                                                    <option value="2">Simon Elbrink</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Attachments</label>
                                            <div className="input-group mb-3">
                                                <input type="file" className="form-select" id="todoAttachments" multiple 
                                                {...register("attachments")}/>
                                                <button className="btn btn-outline-secondary" type="button">
                                                    <i className="bi bi-x-lg"></i>
                                                </button>
                                            </div>
                                            <div className="file-list" id="attachmentPreview"></div>
                                        </div>
                                        <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                                            <button type="submit" className="btn btn-primary">
                                                <i className="bi bi-plus-lg me-2"></i>
                                                Add Task
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>

                            <div className="card shadow-sm tasks-list mt-4">
                                <div className="card-header bg-white d-flex justify-content-between align-items-center">
                                    <h5 className="card-title mb-0">Tasks</h5>
                                    <div className="btn-group">
                                        <select className="form-select" id="todoPersonSelect" onChange={changeFilter}>
                                            <option value="">-- Select filter (Optional) --</option>
                                            <option value="Overdue">Overdue</option>
                                            <option value="InProgress">In Progress</option>
                                            <option value="Complete">Complete</option>
                                            <option value="Nofiltering">No filtering</option>
                                        </select>
                                        <button className="btn btn-outline-secondary btn-sm" title="Sort" onClick={changeSort}>
                                            <i className="bi bi-sort-down"></i>
                                        </button>
                                    </div>
                                </div>
                                <div className="card-body">
                                    <div className="list-group">
                                        {todoTasks.map((todo) => (
                                            <div key={todo.id} className="list-group-item list-group-item-action">
                                                <div className="d-flex w-100 justify-content-between align-items-start">
                                                    <div className="flex-grow-1">
                                                        <div className="d-flex justify-content-between">
                                                            {editTodo && editTodoId === todo.id ? 
                                                                (<input type="text" onChange={changeTitle} defaultValue={titleEditValue}></input>) :
                                                                (<h6 className="mb-1">{todo.title}</h6>)}
                                                            <small className="text-muted ms-2">Created: {removeTime(todo.createdAt)}</small>
                                                        </div>
                                                        {editTodo && editTodoId === todo.id ? 
                                                            (<textarea rows="2" onChange={changeDescription} defaultValue={descEditValue}></textarea>) :
                                                            (<p className="mb-1 text-muted small">{todo.description}</p>)}
                                                        
                                                        <div className="d-flex align-items-center flex-wrap">
                                                            {editTodo && editTodoId === todo.id ? 
                                                                (
                                                                    <>
                                                                    <input type="datetime-local" className='me-2' onChange={changeDueDate} defaultValue={dueDateEditValue}></input>
                                                                    <div>
                                                                        <select className='form-select me-2' onChange={changePerson} defaultValue={personEditValue}>
                                                                        <option value="">-- Select Person (Optional) --</option>
                                                                        <option value="1">Mehrdad Javan</option>
                                                                        <option value="2">Simon Elbrink</option>
                                                                    </select>
                                                                    <select className='form-select' onChange={changeStatus} defaultValue={statusEditValue}>
                                                                        <option value="true">Complete</option>
                                                                        <option value="false">In Progress</option>
                                                                    </select>
                                                                    </div>
                                                                    
                                                                    </>
                                                                ) :
                                                                (<>
                                                                    <small className="text-muted me-2">
                                                                        <i className="bi bi-calendar-event"></i> {removeTime(todo.dueDate)}
                                                                    </small>
                                                                    <span className="badge bg-info me-2">
                                                                        <i className="bi bi-person"></i> {todo.personId === 1 ? "Mehrdad Javan" : "Simon Elbrink"}
                                                                    </span>
                                                                    <span className={`badge ${todo.completed === false ? "bg-warning text-dark" : "bg-success"} me-2`}>
                                                                        {todo.completed === false ? "In progress" : "Complete"}
                                                                    </span>
                                                                </>
                                                                )
                                                                }
                                                            
                                                        </div>
                                                    </div>
                                                    <div className="btn-group ms-3">
                                                        <button className="btn btn-outline-success btn-sm" title="Complete" onClick={() => endEditTodo(todo.id)}>
                                                            <i className="bi bi-check-lg"></i>
                                                        </button>
                                                        <button className="btn btn-outline-primary btn-sm" title="Edit" onClick={() => startEditTodo(todo.id)}>
                                                            <i className="bi bi-pencil"></i>
                                                        </button>
                                                        {hasRole("ROLE_ADMIN") && (
                                                        <button type="button" className="btn btn-outline-danger btn-sm" title="Delete" onClick={() => clickedRemoveTodo(todo.id)} >
                                                            <i className="bi bi-trash"></i>
                                                        </button>)}
                                                        
                                                    </div>
                                                </div>
                                            </div>
                                        ))}                                        
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Task;