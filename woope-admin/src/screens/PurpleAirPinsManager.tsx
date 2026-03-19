import React, { useEffect, useState } from "react";
import Table from "../components/Table";
import Button from "../components/Button";
import Modal from "../components/Modal";
import PageHeader from "../components/PageHeader";
import {
  getPurpleAirPins,
  createPurpleAirPin,
  updatePurpleAirPin,
  deletePurpleAirPin
} from "../api/purpleAirPins";
import {
  getPollInterval,
  updatePollInterval
} from "../api/settings";

const PurpleAirPinsManager = () => {
  const [pins, setPins] = useState<any[]>([]);
  const [selectedPin, setSelectedPin] = useState<any>(null);

  const [name, setName] = useState("");
  const [sensorId, setSensorId] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const [pollIntervalMinutes, setPollIntervalMinutes] = useState("5");

  const tableHeaders = ["ID", "Name", "Sensor ID", "Latitude", "Longitude", "Actions"];

  useEffect(() => {
    fetchPins();
    fetchGlobalPollInterval();
  }, []);

  const fetchPins = async () => {
    try {
      const res = await getPurpleAirPins();
      setPins(res);
    } catch (e) {
      console.error(e);
      setPins([]);
    }
  };

  const fetchGlobalPollInterval = async () => {
    try {
      const res = await getPollInterval();
      setPollIntervalMinutes(String(res.pollIntervalMinutes));
    } catch (e) {
      console.error(e);
    }
  };

  const rows = pins.map((pin) => [
    pin.id.toString(),
    pin.name,
    pin.source_id,
    pin.latitude ?? "",
    pin.longitude ?? "",
    <>
      <button
        className="me-2 btn btn-primary"
        onClick={() => openEditModal(pin)}
        data-bs-toggle="modal"
        data-bs-target="#editPinModal"
      >
        Edit
      </button>
      <button
        className="btn btn-danger"
        onClick={() => openDeleteModal(pin)}
        data-bs-toggle="modal"
        data-bs-target="#deletePinModal"
      >
        Delete
      </button>
    </>,
  ]);

  const resetForm = () => {
    setName("");
    setSensorId("");
  };

  const openEditModal = (pin: any) => {
    setSelectedPin(pin);
    setName(pin.name ?? "");
    setSensorId(pin.source_id ?? "");
    setLatitude(pin.latitude?.toString() ?? "");
    setLongitude(pin.longitude?.toString() ?? "");
  };

  const openDeleteModal = (pin: any) => {
    setSelectedPin(pin);
  };

  const confirmEdit = async () => {
    try {
      await updatePurpleAirPin(selectedPin.id, name, sensorId);
      await fetchPins();
      alert("Pin updated successfully.");
    } catch (e) {
      console.error(e);
      alert("Failed to update pin.");
    }
  };

  const confirmDelete = async () => {
    try {
      await deletePurpleAirPin(selectedPin.id);
      await fetchPins();
      alert("Pin deleted successfully.");
    } catch (e) {
      console.error(e);
      alert("Failed to delete pin.");
    }
  };

  const confirmCreate = async () => {
    try {
      await createPurpleAirPin(name, sensorId);
      resetForm();
      await fetchPins();
      alert("Pin created successfully.");
    } catch (e) {
      console.error(e);
      alert("Failed to create pin.");
    }
  };

  const savePollInterval = async () => {
    try {
      await updatePollInterval(Number(pollIntervalMinutes));
      await fetchGlobalPollInterval();
      alert("Poll interval updated successfully.");
    } catch (e) {
      console.error(e);
      alert("Failed to update poll interval.");
    }
  };

  return (
    <div className="container-lg">
      <div className="card mb-4">
        <div className="card-body">
          <h5 className="card-title">Global Sensor Polling</h5>
          <p className="text-muted mb-2">
            This poll interval applies to all PurpleAir sensors.
          </p>
          <div className="d-flex gap-2">
            <input
              type="number"
              min="1"
              className="form-control"
              placeholder="Poll interval in minutes"
              value={pollIntervalMinutes}
              onChange={(e) => setPollIntervalMinutes(e.target.value)}
            />
            <button className="btn btn-primary" onClick={savePollInterval}>
              Save
            </button>
          </div>
        </div>
      </div>

      <Modal
        id="createPinModal"
        title="Add PurpleAir Pin"
        body={
          <>
            <input
              className="form-control mb-2"
              placeholder="Pin name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="form-control"
              placeholder="PurpleAir Sensor ID"
              value={sensorId}
              onChange={(e) => setSensorId(e.target.value)}
            />
          </>
        }
        footer={
          <button
            className="btn btn-success"
            onClick={confirmCreate}
            data-bs-dismiss="modal"
          >
            Create
          </button>
        }
      />

      <Modal
        id="editPinModal"
        title="Edit PurpleAir Pin"
        body={
          <>
            <input
              className="form-control mb-2"
              placeholder="Pin name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="form-control mb-2"
              placeholder="PurpleAir Sensor ID"
              value={sensorId}
              onChange={(e) => setSensorId(e.target.value)}
            />
            <input
              className="form-control mb-2"
              placeholder="Latitude"
              value={latitude}
              disabled
            />
            <input
              className="form-control"
              placeholder="Longitude"
              value={longitude}
              disabled
            />
          </>
        }
        footer={
          <button
            className="btn btn-primary"
            onClick={confirmEdit}
            data-bs-dismiss="modal"
          >
            Save Changes
          </button>
        }
      />

      <Modal
        id="deletePinModal"
        title="Confirm Delete"
        body={<p>Are you sure you want to delete this pin?</p>}
        footer={
          <button
            className="btn btn-danger"
            onClick={confirmDelete}
            data-bs-dismiss="modal"
          >
            Delete
          </button>
        }
      />

      <PageHeader>PurpleAir Pin Manager</PageHeader>
      <hr />

      <Button className="mb-3" data-bs-toggle="modal" data-bs-target="#createPinModal">
        Add New Pin
      </Button>

      <Table headers={tableHeaders} rows={rows} />
    </div>
  );
};

export default PurpleAirPinsManager;