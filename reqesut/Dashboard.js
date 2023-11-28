import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom'; // React Routerを使用

const Dashboard = () => {
  const [addRequestCount, setAddRequestCount] = useState(0);
  const [removeRequestCount, setRemoveRequestCount] = useState(0);

  useEffect(() => {
    // 追加リクエストの件数を取得
    axios.get('/api/requests/count/add')
      .then(response => setAddRequestCount(response.data.count))
      .catch(error => console.error('Error fetching add request count:', error));

    // 削除リクエストの件数を取得
    axios.get('/api/requests/count/remove')
      .then(response => setRemoveRequestCount(response.data.count))
      .catch(error => console.error('Error fetching remove request count:', error));
  }, []);

  return (
    <div>
      <h1>Request Dashboard</h1>
      <div>
        <Link to="/add-requests">Add Requests ({addRequestCount})</Link>
      </div>
      <div>
        
      </div>
    </div>
  );
};

export default Dashboard;
