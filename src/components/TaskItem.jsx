import React, { useEffect, useMemo, useState } from 'react';
import './Task.css';
import Sidebar from './Sidebar';
import Header from "./Header.jsx";
import { useForm } from "react-hook-form"
import { checkFilter, fetchAllUsers, sendNewTodo, removeTodo, updateTodo } from "./taskService.js";
import { useAuth } from '../context/AuthContext';

const TaskItem = ({
    id,
    title,
    description,
    createdAt,
    dueDate,
    completed,
    personId,
    allUsers,
    clickedRemoveTodo,
    updateTodo,
    attachments,
    fetchTodos,
    fileValidation,
    showButtons
}) => {
    const { hasRole } = useAuth();
    const [editTodo, setEditTodo] = useState(false);
    const [editTodoId, setEditTodoId] = useState("");
    // Contains the values during edit mode.
    const [titleEditValue, setTitleEditValue]= useState("");
    const [descEditValue, setDescEditValue]= useState("");
    const [dueDateEditValue, setDueDateEditValue]= useState("");
    const [personEditValue, setPersonEditValue]= useState("");
    const [statusEditValue, setStatusEditValue]= useState("");
    const [attachmentsEditValue, setAttachmentsEditValue]= useState("");

    const startEditTodo = () => {
        // If one todo is already being edit stop another one from starting.
        if(!editTodo) {
            console.log("start edit todo")
            setEditTodo(true);
            setEditTodoId(id);

           // const currentTodo = todoTasks.find((todo) => todo.id === id);

            setTitleEditValue(title);
            setDescEditValue(description);
            setDueDateEditValue(dueDate);
            setPersonEditValue(personId);
            setStatusEditValue(completed);
            setAttachmentsEditValue(attachments);
        }
    }
    const endEditTodo = async () => {
        // So nothing gets done before edit button is clicked.
        if(editTodo) {
            if(titleEditValue.length < 2) {
                alert("Title must be at leasty 2 characters");
                return;
            } else if(titleEditValue.length > 100) {
                alert("Title can't be more than 100 characters");
                return;
            } else if(descEditValue.length > 500) {
                alert("Description can't be more than 500 characters");
                return;
            } else if(!fileValidation(attachmentsEditValue)) {

            }
            else {
                console.log("end edit todo")
                setEditTodo(false);
                setEditTodoId("")

                // If nothing was changed then its unnecessary to update todo in the back-end.
                const update = checkForChanges(id);

                // Used to set updateAt
                const now = new Date();
                const swedenISO = now.toLocaleString('sv-SE', { timeZone: 'Europe/Stockholm', hour12: false }).replace(' ', 'T');

                // I can't add the todos current file to the input as a default value so if nothing else was added the old one is added here.
                if(attachmentsEditValue.length === 0 && attachments.length > 0) {
                    console.log("-----------No file added on edit!")
                    attachmentsEditValue = attachments;
                }
                    

                if(update) {
                    const data = {
                        "id": id,
                        "title": titleEditValue,
                        "description": descEditValue,
                        "completed": statusEditValue,
                        "createdAt": createdAt,
                        "updatedAt": swedenISO,
                        "dueDate": dueDateEditValue,
                        "personId": personEditValue,
                        "numberOfAttachments": 0,
                        "attachments": attachmentsEditValue
                    }

                    const updateBoolean = await updateTodo(data);
                    if(updateBoolean) fetchTodos();
                    cancelEdit();
                } else {
                    console.log("No changes, not updating")
                    cancelEdit();
                }
            }
        }
    }

    const cancelEdit = () => {
        setEditTodo(false);
        setEditTodoId("");
        setTitleEditValue("");
        setDescEditValue("");
        setDueDateEditValue("");
        setPersonEditValue("");
        setStatusEditValue("");
        setAttachmentsEditValue("");
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
    const changeAttachments = (event) => {
        console.log("changeAttachments:", event.target.files);
        setAttachmentsEditValue(event.target.files);
    }

    // Checks if anything was updated in edit mode.
    const checkForChanges = () => {

        if(title !== titleEditValue) {
            return true;
        } else if(description !== descEditValue) {
            return true;
        } else if(dueDate !== dueDateEditValue) {
            return true;
        } else if(personId !== personEditValue) {
            return true;
        } else if(completed !== statusEditValue) {
            return true;
        } else if(attachmentsEditValue.length > 0) {
            return true;
        }
        return false;
    }
    

    
    // To show the name the personId needs to be checked against all users.
    const getUserNameWithId = () => {
        const user = allUsers.find((user) => user.id === personId);
        if(user !== undefined)
            return user.name;
        return "";
    }

    const getNrOfFiles = () => {
        if(attachments !== undefined && attachments !== null) return attachments.length;
    }



    
    // Used to remove time from dates.
    const removeTime = (date) => {
        if(date === undefined || date === null ||date === "") return "";
        let dateTime = date.split('T');
        return dateTime[0];
    }

    return (
        <div className="list-group-item list-group-item-action">
            <div className="d-flex w-100 justify-content-between align-items-start">
                <div className="flex-grow-1">
                    <div className="d-flex justify-content-between">
                        {editTodo && editTodoId === id ? 
                            (<input type="text" onChange={changeTitle} defaultValue={titleEditValue}></input>) :
                            (<h6 className="mb-1">{title}</h6>)}
                        <small className="text-muted ms-2">Created: {removeTime(createdAt)}</small>
                    </div>
                    {editTodo && editTodoId === id ? 
                        (<textarea rows="2" onChange={changeDescription} defaultValue={descEditValue}></textarea>) :
                        (<p className="mb-1 text-muted small">{description}</p>)}
                    
                    <div className="d-flex align-items-center flex-wrap">
                        {editTodo && editTodoId === id ? 
                            (
                                <>
                                <input type="datetime-local" className='me-2' onChange={changeDueDate} defaultValue={dueDateEditValue}></input>
                                <div>
                                    <select className='form-select me-2' onChange={changePerson} defaultValue={personEditValue}>
                                    <option value="">-- Select Person (Optional) --</option>
                                    {allUsers.map((user) => (
                                        <option value={`${user.id}`}>{user.name}</option>
                                    ))}
                                </select>
                                <select className='form-select' onChange={changeStatus} defaultValue={statusEditValue}>
                                    <option value="true">Complete</option>
                                    <option value="false">In Progress</option>
                                </select>
                                <input type="file" className="form-select" id="todoAttachments" multiple onChange={changeAttachments} onClick={(event) => {event.target.value = null;}}/>
                                </div>
                                
                                </>
                            ) :
                            (<>
                                <small className="text-muted me-2">
                                    <i className="bi bi-calendar-event"></i> {removeTime(dueDate)}
                                </small>
                                <span className="badge bg-info me-2">
                                    <i className="bi bi-person"></i> {getUserNameWithId()}
                                </span>
                                <span className={`badge ${completed === false ? "bg-warning text-dark" : "bg-success"} me-2`}>
                                    {completed === false ? "In progress" : "Complete"}
                                </span>
                                <span className="badge bg-secondary me-2">
                                    <i className="bi bi-paperclip"></i> {getNrOfFiles()} attachments
                                </span>
                            </>
                            )
                            }
                        
                    </div>
                </div>
                {showButtons && (
                    <div className="btn-group ms-3">
                        <button className="btn btn-outline-success btn-sm" title="Complete" onClick={() => endEditTodo()}>
                            <i className="bi bi-check-lg"></i>
                        </button>
                        {editTodo && editTodoId === id ? (
                            <button className="btn btn-outline-primary btn-sm" title="Cancel" onClick={() => cancelEdit()}>
                                <i className="bi bi-trash3"></i>
                            </button>
                            
                        ) :
                        (
                            <button className="btn btn-outline-primary btn-sm" title="Edit" onClick={() => startEditTodo()}>
                                <i className="bi bi-pencil"></i>
                            </button>
                        )}
                        
                        {hasRole("ROLE_ADMIN") && (
                        <button type="button" className="btn btn-outline-danger btn-sm" title="Delete" onClick={clickedRemoveTodo} >
                            <i className="bi bi-trash"></i>
                        </button>)}
                        
                    </div>
                )}
            </div>
        </div>                          
    );
} 

export default TaskItem;