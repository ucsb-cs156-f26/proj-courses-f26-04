import React, { useState } from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import PersonalScheduleSelector from "./PersonalScheduleSelector";
import { schedulesFilter } from "main/utils/PersonalScheduleUtils";
import { yyyyqToQyy } from "main/utils/quarterUtilities.jsx";
import { useBackendMutation } from "main/utils/useBackend";
import { toast } from "react-toastify";

export default function AddToScheduleModal({
  quarter,
  section,
  onAdd,
  schedules,
  testid = "AddToScheduleModal",
}) {
  const [showModal, setShowModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState("");

  const filteringSchedules = schedulesFilter(schedules, quarter);

  const objectToAxiosParams = (personalSchedule) => ({
    url: "/api/personalschedules/post",
    method: "POST",
    params: {
      name: personalSchedule.name,
      description: personalSchedule.description,
      quarter: personalSchedule.quarter,
    },
  });

  const onSuccess = (data) => {
    toast(`Schedule "${data.name}" Created`);
    onAdd(section, data.id);
    handleModalClose();
  };

  const onError = (error) => {
    const message =
      error?.response?.data?.message ?? error?.message ?? "Unknown error";
    toast(`Error: ${message}`);
  };

  const mutation = useBackendMutation(
    objectToAxiosParams,
    { onSuccess, onError },
    // Stryker disable next-line all : hard to set up test for caching
    ["/api/personalschedules/all"],
  );

  const handleModalClose = () => {
    setShowModal(false);
  };

  const handleModalSave = () => {
    onAdd(section, selectedSchedule);
    handleModalClose();
  };

  const handleAddButtonClick = () => {
    if (filteringSchedules.length === 0) {
      mutation.mutate({
        name: yyyyqToQyy(quarter),
        description: "",
        quarter,
      });
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      <Button
        variant="success"
        onClick={handleAddButtonClick}
        disabled={mutation.isLoading}
        data-testid={`${testid}-add-to-schedule-button`}
      >
        {mutation.isLoading ? "Creating..." : "Add"}
      </Button>
      <Modal
        show={showModal && filteringSchedules.length > 0}
        onHide={handleModalClose}
        animation={false}
        data-testid={`${testid}-modal`}
      >
        <Modal.Header closeButton>
          <Modal.Title>Add to Schedule</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="scheduleSelect">
              <Form.Label>Select Schedule</Form.Label>
              <PersonalScheduleSelector
                schedule={selectedSchedule}
                setSchedule={setSelectedSchedule}
                controlId="scheduleSelect"
                filteringSchedules={filteringSchedules}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={handleModalClose}
            data-testid={`${testid}-modal-close-button`}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleModalSave}
            data-testid={`${testid}-modal-save-button`}
          >
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
