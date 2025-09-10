import React, { useEffect, useMemo, useState } from 'react';
import './Task.css';
import './TaskItem.jsx'
import Sidebar from './Sidebar';
import Header from "./Header.jsx";
import { useForm } from "react-hook-form"
import { checkFilter, fetchAllUsers, sendNewTodo, removeTodo, updateTodo } from "./taskService.js";
import { useAuth } from '../context/AuthContext';
import TaskItem from './TaskItem.jsx';

//TODO: I edit mode, nuvarande title och description kommer inte upp.
//TODO: Lägg till mera kommentarer.

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
        nrOfAttachments: 0,
        attachments: [],
        },
    }); 

    const { token, hasRole } = useAuth();
    const [todoTasks, setTodoTasks] = useState([]);
    // True means sorting by earliest dueDate, false means sorting by latest dueDate.
    const [sortByEarliest, setSortByEarliest] = useState(true);
    const [filter, setFilter] = useState("NoFiltering");
    const [allUsers, setAllUsers] = useState([]);

    // On refresh and when an array is changed this useEffect is called.
    useEffect(() => {
        console.log("useEffect has been executed!");
        fetchTodos();
    }, [filter]);

    useEffect(() => {
        // fetchAllUsers in TaskService.js, it fetches all users.
        setUpUsers();
    }, []); //[] <-on page render

    // Call checkFilter in TaskService.js which checks what filter is on before sending the right path to the fetch function.
    // Then adds them to the state todoTasks
    const fetchTodos = async () => {
        const todos = await checkFilter(filter, token);
        console.log("Todos: -----------", todos);
        setTodoTasks(todos);
    }

    // Calls fetchAllUsers to get all users and adds them to allUser state.
    const setUpUsers = async () => {
        const users = await fetchAllUsers(token);
        console.log("Users: -----------", users);
        setAllUsers(users);
    }


    const onSubmit = async (data) => {
        console.log("### Starting to send the new task to backend...")
        
        // form hook library doesn't seem to have a validation for file type so this is my custom valiation.
        const passedFileValidation = fileValidation(data.attachments);
        if(passedFileValidation) {
            console.log("File validation succeded");

            const sendBoolean = await sendNewTodo(data, token);
            if(sendBoolean) {
                reset();
                fetchTodos();
            }
        } else {
            console.log("File validation failed");
        }
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
    const clickedRemoveTodo = async (id) => {
        const removeBoolean = await removeTodo(id, token);
        if(removeBoolean) fetchTodos();
    }
    
    //sort by dueDate, Memo will only recompute the memorized value when one of the depoendencies has changed. 
    const sortByDate = useMemo(() => {
        console.log("Sort");
        if(sortByEarliest) {
            todoTasks.sort((a, b) => a.dueDate > b.dueDate ? 1 : -1 )
        }
        else {
            todoTasks.sort((a, b) => a.dueDate > b.dueDate ? -1 : 1 );
        }
    }, [todoTasks, sortByEarliest])
    
    const changeSort = () => {
        console.log("Change sort");
        setSortByEarliest(sortByEarliest === true ? false : true);
    }

    const changeFilter = (event) => {
        console.log("change filter");
        setFilter(event.target.value);
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
                                                    {allUsers.map((user) => (
                                                        <option value={`${user.id}`}>{user.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Attachments</label>
                                            <div className="input-group mb-3">
                                                <input type="file" className="form-select" id="todoAttachments" multiple 
                                                {...register("attachments")}/>
                                                <button className="btn btn-outline-secondary" type="button" onClick={() => reset()}>
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
                                            <TaskItem key={todo.id}
                                                id = {todo.id}
                                                title = {todo.title}
                                                description={todo.description}
                                                createdAt={todo.createdAt}
                                                dueDate={todo.dueDate}
                                                completed={todo.completed}
                                                personId={todo.personId}
                                                attachments={todo.attachments}
                                                allUsers={allUsers}
                                                clickedRemoveTodo = {() => clickedRemoveTodo(todo.id)}
                                                updateTodo={(data) => updateTodo(todo.id, data, token)}
                                                fetchTodos={() => fetchTodos()}
                                                fileValidation={(files) => fileValidation(files)}
                                                showButtons={true}
                                            /> 
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