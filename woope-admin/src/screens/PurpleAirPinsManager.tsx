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

const PurpleAirPinsManager = () => {
  const [pins, setPins] = useState<any[]>([]);
  const [selectedPin, setSelectedPin] = useState<any>(null);

  const [name, setName] = useState("");
  const [sensorId, setSensorId] = useState("");

  const tableHeaders = ["ID", "Name", "Sensor ID", "Actions"];

  useEffect(() => {
    fetchPins();
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

  const rows = pins.map((pin) => [
    pin.id.toString(),
    pin.name,
    pin.source_id, // ✅ updated from purple_air_sensor_id
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

  const openEditModal = (pin: any) => {
    setSelectedPin(pin);
    setName(pin.name);
    setSensorId(pin.source_id); // ✅ updated from purple_air_sensor_id
  };

  const openDeleteModal = (pin: any) => {
    setSelectedPin(pin);
  };

  const confirmEdit = async () => {
    try {
      await updatePurpleAirPin(
        selectedPin.id,
        name,
        sensorId
      );
      fetchPins();
      alert("Pin updated successfully.");
    } catch (e) {
      console.error(e);
      alert("Failed to update pin.");
    }
  };

  const confirmDelete = async () => {
    try {
      await deletePurpleAirPin(selectedPin.id);
      fetchPins();
      alert("Pin deleted successfully.");
    } catch (e) {
      console.error(e);
      alert("Failed to delete pin.");
    }
  };

  const confirmCreate = async () => {
    try {
      await createPurpleAirPin(name, sensorId);
      setName("");
      setSensorId("");
      fetchPins();
      alert("Pin created successfully.");
    } catch (e) {
      console.error(e);
      alert("Failed to create pin.");
    }
  };

  return (
    <div className="container-lg">

      {/* Create Pin Modal */}
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

      {/* Edit Pin Modal */}
      <Modal
        id="editPinModal"
        title="Edit PurpleAir Pin"
        body={
          <>
            <input className="form-control mb-2" value={name} onChange={(e) => setName(e.target.value)}/>
            <input className="form-control" value={sensorId} onChange={(e) => setSensorId(e.target.value)}/>
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

      {/* Delete Pin Modal */}
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
