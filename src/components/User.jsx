import React, { useEffect, useMemo, useState } from 'react';
import Sidebar from './Sidebar';
import Header from "./Header.jsx";
import TaskItem from './TaskItem.jsx';
import { useAuth } from '../context/AuthContext';
import { fetchAllUsers, fetchTasksFromSpecificUser as fetchTaskFromUser } from "./taskService.js";

const User = () => {
    const { token, hasRole } = useAuth();
    const [allUsers, setAllUsers] = useState([]);
    const [userTasks, setUserTasks] = useState([]); 

    useEffect(() => {
        // fetchAllUsers in TaskService.js, it fetches all users.
        setUpUsers();
    }, []); //[] <-on page render

    // Calls fetchAllUsers to get all users (persons entity) and adds them to allUser state.
    const setUpUsers = async () => {
        console.log("Start fetching all users...");

        const users = await fetchAllUsers(token);
        console.log("Users: -----------", users);
        setAllUsers(users);
    }

    const showUserTasks = async (id) => {
        console.log("Start fetching tasks of user with id: ", id)

        const tasks = await fetchTaskFromUser(id, token);
        console.log("Tasks: -----------", tasks);
        setUserTasks(tasks);
    }

    //TODO:
    // 2: clicking it will show all their task in a secondary tabell, 
    // 3: should I use TaskItem? I have to add some sort of bool on the edit/remove buttons because they should be shown

    return (
        <div className="dashboard-layout">
            <Sidebar isOpen={false} onClose={() => {}} />
            <main className="dashboard-main">
                <Header
                    title="Team"
                    subtitle="Manage and organize the Users"
                    onToggleSidebar={() => {}}
                />
                <div className="dashboard-content">
                    <table class="table">
                        <thead>
                            <tr>
                                <th scope="col">#</th>
                                <th scope="col">Name</th>
                                <th scope="col">Email</th>
                                <th scope='col'>Show Tasks</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allUsers.map((user) => (
                                <tr key={user.id}>
                                <th scope="row">{user.id}</th>
                                <td>{user.name}</td>
                                <td>{user.email}</td>
                                <td scope='col'><button className='btn btn-secondary btn-sm' onClick={() => showUserTasks(user.id)}>Show Tasks</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="card-body">
                        <div className="list-group">
                            {userTasks.map((todo) => (
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
                                    showButtons={false}
                                /> 
                            ))}    
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default User;