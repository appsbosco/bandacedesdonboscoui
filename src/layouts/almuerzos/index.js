// Banda CEDES Don Bosco components

// Banda CEDES Don Bosco examples
import Footer from "examples/Footer";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";

// Images
import Bebida from "../../assets/images/almuerzo/bebidas.webp";
import Almuerzo from "../../assets/images/almuerzo/lunch.webp";
import Todos from "../../assets/images/almuerzo/todos.webp";
import Success from "../../assets/images/almuerzo/success.webp";
import Bg from "../../assets/images/almuerzo/bg.jpg";

import Almuerzo2 from "../../assets/images/almuerzo/almuerzo.webp";
import Bebida2 from "../../assets/images/almuerzo/bebida.webp";
import Postre2 from "../../assets/images/almuerzo/postre.webp";

import Postre from "../../assets/images/almuerzo/postres.webp";
import { GET_PRODUCTS } from "graphql/queries";
import { useMutation, useQuery } from "@apollo/client";
import { useState } from "react";
import { CREATE_ORDER } from "graphql/mutations";
import { GET_USERS_BY_ID } from "graphql/queries";
import { GET_ORDERS } from "graphql/queries";
import DashboardNavbar from "examples/Navbars/CartsNavBar";
import { GET_ORDERS_BY_USER } from "graphql/queries";
import SoftTypography from "components/SoftTypography";
import { Icon, Tooltip } from "@mui/material";
import AddLunchModal from "components/AddLunchModal";
import { CREATE_PRODUCT } from "graphql/mutations";
import { DELETE_PRODUCT } from "graphql/mutations";

const Almuerzos = () => {
  const { loading, error, data } = useQuery(GET_PRODUCTS);

  const [open, setOpen] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState("");
  const [alert, setAlert] = useState({ show: false, message: "" });

  const [openModal, setOpenModal] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [cart, setCart] = useState([]);
  const [selectedQuantities, setSelectedQuantities] = useState({});

  const { data: userData, loading: userLoading, error: userError } = useQuery(GET_USERS_BY_ID);

  const userId = userData?.getUser?.id;
  const userRole = userData?.getUser?.role;

  console.log("USER DATA", userData);

  const [createOrder, { data: orderData, loading: orderLoading, error: orderError }] = useMutation(
    CREATE_ORDER,
    {
      refetchQueries: [{ query: GET_ORDERS }, { query: GET_ORDERS_BY_USER, variables: { userId } }],
    }
  );

  const [deleteProduct] = useMutation(DELETE_PRODUCT, {
    refetchQueries: [{ query: GET_PRODUCTS }],
  });
  const [addProduct] = useMutation(CREATE_PRODUCT, {
    refetchQueries: [{ query: GET_PRODUCTS }],
  });

  // Función para actualizar la categoría seleccionada
  const handleCategorySelection = (category) => {
    setSelectedCategory(category);
  };

  if (userLoading) return <p>Cargando información del usuario...</p>;
  if (userError) return <p>Error al obtener la información del usuario: {userError.message}</p>;

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error :(</p>;

  // const addToCart = (product) => {
  //   const quantity = selectedQuantities[product.id] || 1;
  //   setCart((prevCart) => {
  //     const isProductInCart = prevCart.find((item) => item.product.id === product.id);
  //     if (isProductInCart) {
  //       return prevCart.map((item) =>
  //         item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
  //       );
  //     } else {
  //       return [...prevCart, { product, quantity }];
  //     }
  //   });
  // };

  const addToCart = (product) => {
    // Convertir la fecha de cierre a un objeto Date
    const closingDate = product.closingDate;
    // Obtener la fecha y hora actuales
    const now = new Date();

    // Verificar si la fecha y hora de cierre son mayores que la fecha y hora actuales
    if (closingDate > now) {
      const quantity = selectedQuantities[product.id] || 1;
      setCart((prevCart) => {
        const isProductInCart = prevCart.find((item) => item.product.id === product.id);
        if (isProductInCart) {
          return prevCart.map((item) =>
            item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
          );
        } else {
          return [...prevCart, { product, quantity }];
        }
      });
    } else {
      // Mostrar mensaje de error si la fecha y hora de cierre han pasado
      // alert("Este producto ya no está disponible para ser añadido al carrito.");
      setAlert({
        show: true,
        message: "Este producto ya no está disponible para ser añadido al carrito.",
      });

      setTimeout(() => {
        setAlert({ ...alert, show: false });
      }, 4000);
    }
  };

  const handleIncrement = (productId) => {
    setSelectedQuantities((prevQuantities) => {
      const currentQuantity = prevQuantities[productId] || 0;
      return {
        ...prevQuantities,
        [productId]: currentQuantity + 1,
      };
    });
  };

  const handleDecrement = (productId) => {
    setSelectedQuantities((prevQuantities) => {
      const currentQuantity = prevQuantities[productId] || 0;
      const newQuantity = currentQuantity > 1 ? currentQuantity - 1 : 1;
      return {
        ...prevQuantities,
        [productId]: newQuantity,
      };
    });
  };

  // Función para manejar cambios en la cantidad seleccionada
  const handleQuantityChange = (productId, quantity) => {
    setSelectedQuantities((prevQuantities) => ({
      ...prevQuantities,
      [productId]: quantity,
    }));
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
  };

  const handleOpen = () => setOpen(!open);

  const submitOrder = async (userId) => {
    const products = cart.map(({ product, quantity }) => ({
      productId: product.id,
      quantity,
    }));

    try {
      await createOrder({
        variables: {
          userId,
          products,
        },
      });
      // Manejo post-creación de la orden, como limpiar el carrito
      setCart([]);
      handleOpen();
      // Mostrar mensaje de éxito o redirigir al usuario
    } catch (error) {
      console.error("Error al crear la orden:", error);
    }
  };

  // const getImageForCategory = (category) => {
  //   switch (category) {
  //     case "Bebidas":
  //       return Bebida2;
  //     case "Almuerzo":
  //       return Almuerzo2;
  //     case "Postres":
  //       return Postre2;

  //     default:
  //       return Almuerzo2;
  //   }
  // };

  const handleOpenModal = (type) => {
    setModalType(type);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setModalType(null);
  };

  const handleAddProduct = async (productData) => {
    try {
      await addProduct({
        variables: {
          name: productData.name,
          description: productData.description,
          price: parseFloat(productData.price),
          availableForDays: productData.availableForDays,
          photo: productData.photo,
          closingDate: productData.closingDate,
          category: productData.category,
        },
      });
      handleCloseModal();
    } catch (error) {
      console.error("Error al agregar el producto:", error);
    }
  };

  const handleDeleteProduct = async (productId) => {
    try {
      await deleteProduct({
        variables: {
          deleteProductId: productId,
        },
      });
      setAlert({
        show: true,
        message: "Producto eliminado exitosamente",
      });

      setTimeout(() => {
        setAlert({ ...alert, show: false });
      }, 4000);
    } catch (error) {
      console.error("Error al eliminar el producto:", error);
      setAlert({
        show: true,
        message: "Error al eliminar el producto",
      });

      setTimeout(() => {
        setAlert({ ...alert, show: false });
      }, 4000);
    }
  };

  if (loading) return <p>Cargando productos...</p>;
  if (error) return <p>Error al cargar productos, {error} </p>;

  console.log("error", error);
  return (
    <DashboardLayout>
      <DashboardNavbar />

      <>
        {alert.show && (
          <div
            id="popup-modal"
            tabIndex="-1"
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: "9999",

              padding: "20px",
              textAlign: "center",

              maxWidth: "90%",
              width: "400px",
            }}
          >
            <div className="relative p-4 w-full max-w-md max-h-full">
              <div className="relative bg-white rounded-lg shadow ">
                <div className="p-4 md:p-5 text-center">
                  <svg
                    className="mx-auto mb-4 text-red-700 w-12 h-12 "
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 20 20"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M10 11V6m0 8h.01M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                    />
                  </svg>
                  <h3 className="mb-5 text-lg font-normal text-gray-500 ">{alert.message}</h3>
                </div>
              </div>
            </div>
          </div>
        )}

        {open && (
          <div
            id="popup-modal"
            tabIndex="-1"
            className="flex overflow-y-auto overflow-x-hidden fixed inset-0 z-50 justify-center items-center"
          >
            <div className="relative p-4 w-full max-w-md max-h-full">
              <div className="relative bg-white rounded-lg shadow ">
                <button
                  type="button"
                  className="absolute top-3 end-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center  "
                  data-modal-hide="popup-modal"
                >
                  <svg
                    className="w-3 h-3"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 14 14"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                    />
                  </svg>
                  <span className="sr-only">Cerrar</span>
                </button>
                <div className="p-4 md:p-5 text-center">
                  <img src={Success} className="mx-auto w-6/12 h-full" />

                  <h3 className="mb-5 mt-5 text-lg font-normal text-gray-500 ">
                    Se ha creado tu orden
                  </h3>
                  <button
                    data-modal-hide="popup-modal"
                    type="button"
                    onClick={() => setOpen(false)}
                    className=" bg-cyan-950 dont-medium rounded-lg text-sm inline-flex items-center px-5 py-2.5 text-center"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>

      <div className="grid xl:grid-cols-3 grid-cols-1 gap-6 mb-3 mt-4">
        <div className="xl:col-span-2">
          <div className="flex">
            <div
              className="relative rounded-lg overflow-hidden bg-no-repeat bg-cover bg-blend-saturation  w-full"
              style={{ backgroundImage: `url(${Bg})` }}
            >
              <div className="absolute inset-0 bg-black opacity-75"></div>
              <div className="relative p-8 md:p-12">
                <h4 className="text-2xl text-white font-semibold mb-4">Solicitud de almuerzos</h4>
                <p className="text-base text-white mb-6 max-w-lg">
                  Bienvenido a la plataforma de almuerzos de la Banda CEDES Don Bosco. Aquí puedes
                  solicitar tu almuerzo de forma rápida y sencilla. Selecciona entre una variedad de
                  opciones para satisfacer tus gustos.
                </p>
                {/* <a
                  href="javascript:void(0)"
                  onClick={() => productSectionRef.current.scrollIntoView({ behavior: "smooth" })}
                  className="inline-flex items-center justify-center gap-2 rounded-full border  bg-[#293964] px-10 py-3 text-center text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:border-l-purple-950-700 hover:bg-[#293964]-500"
                >
                  Pedir ahora
                </a> */}
              </div>
            </div>
          </div>

          <div className="pb-10 py-10">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
              <h3 className="text-xl font-semibold text-default-950">Categorías</h3>
            </div>
            <div className="grid lg:grid-cols-6 grid-cols-3 gap-6">
              <div
                onClick={() => handleCategorySelection("")}
                className="text-center space-y-4 cursor-pointer"
              >
                <div className="">
                  <img src={Todos} className="mx-auto w-6/12 h-full" />
                </div>
                <h5 className="text-lg text-default-600">Todos</h5>
              </div>
              <div
                onClick={() => handleCategorySelection("Almuerzo")}
                className="text-center space-y-4 cursor-pointer"
              >
                <div className="">
                  <img src={Almuerzo} className="mx-auto w-6/12 h-full" />
                </div>
                <h5 className="text-lg text-default-600">Almuerzo</h5>
              </div>
              <div
                onClick={() => handleCategorySelection("Bebidas")}
                className="text-center space-y-4 cursor-pointer"
              >
                <div className="">
                  <img src={Bebida} className="mx-auto w-6/12 h-full" />
                </div>
                <h5 className="text-lg text-default-600">Bebidas</h5>
              </div>

              <div
                onClick={() => handleCategorySelection("Postres")}
                className="text-center space-y-4 cursor-pointer"
              >
                <div className="">
                  <img src={Postre} className="mx-auto w-6/12 h-full" />
                </div>
                <h5 className="text-lg text-default-600">Postres</h5>
              </div>
            </div>
          </div>

          <div className="pb-10">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
              <h3 className="text-xl font-semibold text-default-950">Productos</h3>

              {userRole !== "Admin" && userRole !== "Staff" ? null : (
                <SoftTypography variant="body2" color="secondary">
                  <Tooltip placement="top">
                    <Icon onClick={() => handleOpenModal("add")}>add</Icon>
                  </Tooltip>
                </SoftTypography>
              )}
            </div>

            <div className="grid lg:grid-cols-4 gap-6">
              {data.products.filter(
                (product) => selectedCategory === "" || product.category === selectedCategory
              ).length > 0 ? (
                data.products
                  .filter(
                    (product) => selectedCategory === "" || product.category === selectedCategory
                  )
                  .map((product) => (
                    // Renderización de cada producto
                    <>
                      {/* <div
                        key={product.id}
                        className="border border-default-200 rounded-lg p-6 overflow-hidden hover:border-purple-950 transition-all duration-300"
                      >
                        <div className="relative rounded-lg overflow-hidden divide-y divide-default-200">
                          <div className="pt-2 space-y-2">
                            <h6 className=" text-xs text-default-500">{product.category}</h6>

                            <h4 className="text-default-800 text-2xl font-semibold  mb-2">
                              {product.name}
                            </h4>
                            <h6 className=" text-lg text-default-500">{product.description}</h6>
                          </div>
                          <div className="mt-4 mx-auto">
                            <img
                              src={getImageForCategory(product.category)}
                              alt={product.name}
                              className="w-full h-full"
                            />
                          </div>
                          <div className="">
                            <div className="flex justify-between items-center ">
                              <div>
                                <h4 className="font-semibold text-xl text-default-9000">
                                  ₡ {product.price}
                                </h4>
                              </div>

                              <div className="flex items-center space-x-2 bg-white border rounded-full mt-5">
                                <div className="relative flex items-center max-w-[8rem]">
                                  <button
                                    type="button"
                                    className="bg-white    border  rounded-s-lg p-3 h-9   "
                                    onClick={() => handleDecrement(product.id)}
                                  >
                                    <svg
                                      className="w-2 h-2 text-gray-900 "
                                      aria-hidden="true"
                                      xmlns="http://www.w3.org/2000/svg"
                                      fill="none"
                                      viewBox="0 0 18 2"
                                    >
                                      <path
                                        stroke="currentColor"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M1 1h16"
                                      />
                                    </svg>
                                  </button>
                                  <input
                                    type="text"
                                    pattern="\d*"
                                    value={selectedQuantities[product.id] || 1}
                                    onChange={(e) =>
                                      handleQuantityChange(product.id, parseInt(e.target.value))
                                    }
                                    className="bg-white border-x-0  p-6 h-9  text-center text-gray-900 text-sm focus:ring-blue-500 focus:border-blue-500 block w-full py-2.5 "
                                    placeholder="999"
                                    required
                                  />
                                  <button
                                    type="button"
                                    className="bg-white   hover:bg-gray-200 border  rounded-e-lg p-3 h-9    "
                                    onClick={() => handleIncrement(product.id)}
                                  >
                                    <svg
                                      className="w-2 h-2 text-gray-900 "
                                      aria-hidden="true"
                                      xmlns="http://www.w3.org/2000/svg"
                                      fill="none"
                                      viewBox="0 0 18 18"
                                    >
                                      <path
                                        stroke="currentColor"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M9 1v16M1 9h16"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={() => addToCart(product)}
                              className="relative z-10 w-full inline-flex items-center justify-center rounded-full border border-primary bg-black px-6 py-3 text-center text-sm font-medium text-white shadow-sm transition-all duration-500 hover:bg-primary-500 "
                            >
                              Añadir
                            </button>
                          </div>
                        </div>
                      </div> */}
                      <div
                        key={product.id}
                        className="order-3 border border-default-200 rounded-lg p-4 overflow-hidden hover:border-primary hover:shadow-xl transition-all duration-300"
                      >
                        <div className="relative rounded-lg overflow-hidden divide-y divide-default-200 group">
                          <div className="mb-4 mx-auto">
                            <img
                              className="w-full h-full group-hover:scale-105 transition-all"
                              src={product.photo}
                            />
                          </div>

                          <div className="pt-2">
                            <div className="flex items-center justify-between mb-4">
                              <h4
                                className="text-default-800 text-xl font-semibold  after:absolute after:inset-0"
                                href=""
                              >
                                {product.name} - {product.availableForDays}
                              </h4>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                data-lucide="heart"
                                className="lucide lucide-heart h-6 w-6 text-default-200 cursor-pointer hover:text-red-500 hover:fill-red-500 transition-all relative z-10"
                              >
                                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
                              </svg>
                            </div>
                            <span className="inline-flex items-center gap-2 mb-4">
                              <span className="text-sm text-default-950 from-inherit">
                                {product.description}
                              </span>
                            </span>
                            <div className="flex items-end justify-between mb-4">
                              <h4 className="font-semibold text-xl text-default-900">
                                {" "}
                                ₡ {product.price}
                              </h4>
                              <div className="flex items-center space-x-2 bg-white border rounded-full mt-5">
                                <div className="relative flex items-center max-w-[8rem]">
                                  <button
                                    type="button"
                                    className="bg-white    border  rounded-s-lg p-3 h-9   "
                                    onClick={() => handleDecrement(product.id)}
                                  >
                                    <svg
                                      className="w-2 h-2 text-gray-900 "
                                      aria-hidden="true"
                                      xmlns="http://www.w3.org/2000/svg"
                                      fill="none"
                                      viewBox="0 0 18 2"
                                    >
                                      <path
                                        stroke="currentColor"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M1 1h16"
                                      />
                                    </svg>
                                  </button>
                                  <input
                                    type="text"
                                    pattern="\d*"
                                    value={selectedQuantities[product.id] || 1}
                                    onChange={(e) =>
                                      handleQuantityChange(product.id, parseInt(e.target.value))
                                    }
                                    className="bg-white border-x-0  p-6 h-9  text-center text-gray-900 text-sm focus:ring-blue-500 focus:border-blue-500 block w-full py-2.5 "
                                    placeholder="999"
                                    required
                                  />
                                  <button
                                    type="button"
                                    className="bg-white   hover:bg-gray-200 border  rounded-e-lg p-3 h-9    "
                                    onClick={() => handleIncrement(product.id)}
                                  >
                                    <svg
                                      className="w-2 h-2 text-gray-900 "
                                      aria-hidden="true"
                                      xmlns="http://www.w3.org/2000/svg"
                                      fill="none"
                                      viewBox="0 0 18 18"
                                    >
                                      <path
                                        stroke="currentColor"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M9 1v16M1 9h16"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2  mt-5">
                              <button
                                className="relative z-10 w-full inline-flex items-center justify-center rounded-full border border-primary bg-black px-6 py-3 text-center text-sm font-medium text-white shadow-sm transition-all duration-500 hover:bg-white hover:text-black"
                                onClick={() => addToCart(product)}
                              >
                                Añadir
                              </button>

                              {userRole !== "Admin" && userRole !== "Staff" ? null : (
                                <button
                                  className="relative z-10 w-full inline-flex items-center justify-center rounded-full border border-primary bg-black px-6 py-3 text-center text-sm font-medium text-white shadow-sm transition-all duration-500 hover:bg-white hover:text-black"
                                  onClick={() => handleDeleteProduct(product.id)}
                                >
                                  Eliminar
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  ))
              ) : (
                <div className="col-span-full text-center">
                  <p>No hay productos disponibles para esta categoría.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="border border-default-200 rounded-lg">
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-xl text-default-800 font-semibold mb-4">Checkout</h2>
              </div>

              <div className="">
                <h3 className="text-xl font-semibold text-default-800">Resumen de tu orden</h3>
                <div className="">
                  {cart.length > 0 ? (
                    <div className="my-6 border-b border-default-200">
                      {cart.map(({ product, quantity }) => (
                        <>
                          <div key={product.id} className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                              <img
                                src={product.photo}
                                alt={product.name}
                                className="h-16 w-16 object-cover rounded-full "
                              />
                              <div className="">
                                <a
                                  href=""
                                  className="text-base font-medium text-default-800 line-clamp-1"
                                >
                                  {product.name}
                                </a>
                                <p className="text-sm font-medium text-default-800">
                                  x{quantity} - ₡ {product.price * quantity}
                                </p>
                                {/* <h3 className="text-base font-medium text-default-800">
                                  {" "}
                                  ₡ {product.price * quantity}
                                </h3> */}
                              </div>
                            </div>

                            <button onClick={() => removeFromCart(product.id)}>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                data-lucide="x-circle"
                                className="lucide lucide-x-circle w-5 h-5 text-default-400"
                              >
                                <circle cx="12" cy="12" r="10"></circle>
                                <path d="m15 9-6 6"></path>
                                <path d="m9 9 6 6"></path>
                              </svg>
                            </button>
                          </div>
                        </>
                      ))}
                    </div>
                  ) : (
                    // Mensaje cuando el carrito está vacío
                    <div className="flex items-center justify-center h-64">
                      <p className="text-lg text-gray-500">No hay nada en el carrito.</p>
                    </div>
                  )}

                  <div className="py-6">
                    <div className="flex items-center justify-between py-3">
                      <h6 className="text-base text-default-800 font-medium">Total :</h6>
                      <h4 className="text-xl text-primary font-semibold ">
                        ₡ {cart.reduce((acc, curr) => acc + curr.product.price * curr.quantity, 0)}
                      </h4>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <button
                    className="flex items-center justify-center gap-2 rounded-full border border-l-purple-950 bg-[#293964] px-10 py-4 text-center text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:border-l-purple-950-700 hover:bg-[#1a2441]"
                    onClick={() => userId && cart.length > 0 && submitOrder(userId)}
                    disabled={cart.length === 0 || orderLoading || !userId}
                  >
                    Confirmar Orden
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Event Modal */}
      {modalType === "add" && (
        <AddLunchModal
          open={openModal}
          onClose={handleCloseModal}
          title="Agregar evento"
          onSubmit={handleAddProduct}
        />
      )}
      <Footer />
    </DashboardLayout>
  );
};

export default Almuerzos;

// <div className="py-10">
// <div className="flex items-center mb-10">
//   <h3 className="text-xl font-semibold text-default-950">Analytics Overview</h3>
// </div>
// <div className="grid lg:grid-cols-4 grid-cols-2 gap-6">
//   <div className="border border-default-200 rounded-lg p-4 overflow-hidden text-center hover:border-l-purple-950 transition-all duration-300">
//     <h4 className="text-2xl text-primary font-semibold mb-2">12.56K</h4>
//     <h6 className="text-lg font-medium text-default-950 mb-4">Total Revenue</h6>
//     <p className="text-sm text-default-600">10% Increase</p>
//   </div>
//   <div className="border border-default-200 rounded-lg p-4 overflow-hidden text-center hover:border-l-purple-950 transition-all duration-300">
//     <h4 className="text-2xl text-primary font-semibold mb-2">2.5K</h4>
//     <h6 className="text-lg font-medium text-default-950 mb-4">New Orders</h6>
//     <p className="text-sm text-default-600">05% Increase</p>
//   </div>
//   <div className="border border-default-200 rounded-lg p-4 overflow-hidden text-center hover:border-l-purple-950 transition-all duration-300">
//     <h4 className="text-2xl text-primary font-semibold mb-2">400</h4>
//     <h6 className="text-lg font-medium text-default-950 mb-4">Received Order</h6>
//     <p className="text-sm text-default-600">30% Increase</p>
//   </div>
//   <div className="border border-default-200 rounded-lg p-4 overflow-hidden text-center hover:border-l-purple-950 transition-all duration-300">
//     <h4 className="text-2xl text-primary font-semibold mb-2">476</h4>
//     <h6 className="text-lg font-medium text-default-950 mb-4">Reviews</h6>
//     <p className="text-sm text-default-600">15% Increase</p>
//   </div>
// </div>
// </div>
