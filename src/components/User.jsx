import React, { useEffect, useMemo, useState } from 'react';
import Sidebar from './Sidebar';
import Header from "./Header.jsx";
import { useAuth } from '../context/AuthContext';
import { fetchAllUsers} from "./taskService.js";

const User = () => {
    const { token, hasRole } = useAuth();
    const [allUsers, setAllUsers] = useState([]);

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

    //TODO: Show all the tasks each user is assigned to?

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
                          </tr>
                      </thead>
                      <tbody>
                            {allUsers.map((user) => (
                                <tr key={user.id}>
                                <th scope="row">{user.id}</th>
                                <td>{user.name}</td>
                                <td>{user.email}</td>
                                </tr>
                            ))}
                      </tbody>
                  </table>
              </div>
          </main>
      </div>
    );
}

export default User;