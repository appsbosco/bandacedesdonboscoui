import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { GET_TOURS, CREATE_TOUR, UPDATE_TOUR, DELETE_TOUR } from "./tours.gql";

export function useTours() {
  const [formModal, setFormModal] = useState({ open: false, mode: "create", tour: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, tour: null });
  const [toast, setToast] = useState(null);

  const { data, loading, error, refetch } = useQuery(GET_TOURS, {
    fetchPolicy: "cache-and-network",
  });

  console.log("Date error", data);

  const [createTour, { loading: creating }] = useMutation(CREATE_TOUR, {
    onCompleted: () => {
      showToast("Gira creada correctamente", "success");
      closeFormModal();
      refetch();
    },
    onError: (e) => showToast(e.message, "error"),
  });

  const [updateTour, { loading: updating }] = useMutation(UPDATE_TOUR, {
    onCompleted: () => {
      showToast("Gira actualizada correctamente", "success");
      closeFormModal();
      refetch();
    },
    onError: (e) => showToast(e.message, "error"),
  });

  const [deleteTour, { loading: deleting }] = useMutation(DELETE_TOUR, {
    onCompleted: () => {
      showToast("Gira eliminada", "success");
      setDeleteModal({ open: false, tour: null });
      refetch();
    },
    onError: (e) => showToast(e.message, "error"),
  });

  const showToast = (message, type = "success") => setToast({ message, type });

  const openCreateModal = () => setFormModal({ open: true, mode: "create", tour: null });
  const openEditModal = (tour) => setFormModal({ open: true, mode: "edit", tour });
  const closeFormModal = () => setFormModal({ open: false, mode: "create", tour: null });

  const openDeleteModal = (tour) => setDeleteModal({ open: true, tour });
  const closeDeleteModal = () => setDeleteModal({ open: false, tour: null });

  const handleSubmit = async (input) => {
    if (formModal.mode === "create") {
      await createTour({ variables: { input } });
    } else {
      await updateTour({ variables: { id: formModal.tour.id, input } });
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.tour) return;
    await deleteTour({ variables: { id: deleteModal.tour.id } });
  };

  return {
    tours: data?.getTours || [],
    loading,
    error,
    // Modals
    formModal,
    deleteModal,
    openCreateModal,
    openEditModal,
    closeFormModal,
    openDeleteModal,
    closeDeleteModal,
    // Actions
    handleSubmit,
    handleDelete,
    // Loading
    creating,
    updating,
    deleting,
    // Toast
    toast,
    setToast,
  };
}
