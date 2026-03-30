import React, { useEffect, useState } from "react";
import Table from "../components/Table";
import Button from "../components/Button";
import PageHeader from "../components/PageHeader";
import { getLogs } from "../api/user-actions";

const LogManager = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [filteredLogs, setFilteredLogs] = useState<string[][]>([]);

  const tableHeaders = ["ID", "User", "Action", "Timestamp"];

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await getLogs();
      setLogs(res);
      setFilteredLogs(formatRows(res));
    } catch (e) {
      console.error("Error fetching logs:", e);
      setFilteredLogs([]);
    }
  };

  const formatRows = (data: any[]) => {
    return data.map((log: any) => [
      "" + log.id,
      log.first_name && log.last_name
        ? `${log.first_name} ${log.last_name}`
        : `User ${log.user_id}`,
      log.action,
      new Date(log.action_time).toLocaleString(),
    ]);
  };

  const handleSearch = () => {
    if (!searchInput) {
      setFilteredLogs(formatRows(logs));
      return;
    }

    const filtered = logs.filter((log: any) =>
      log.action.toLowerCase().includes(searchInput.toLowerCase())
    );

    setFilteredLogs(formatRows(filtered));
  };

  return (
    <div className="container-lg">
      <PageHeader>User Activity Logs</PageHeader>
      <hr />

      {/* Search Bar (Same Layout as Pin/Post Manager) */}
      <div className="row mb-3">
        <div className="col-sm-4">
          <input
            type="text"
            className="form-control"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search Logs by Action"
          />
        </div>
        <div className="col-sm-3">
          <Button onClick={handleSearch}>Search</Button>
        </div>
      </div>

      <Table headers={tableHeaders} rows={filteredLogs} />
    </div>
  );
};

export default LogManager;