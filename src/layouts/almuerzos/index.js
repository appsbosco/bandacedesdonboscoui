// Banda CEDES Don Bosco components

// Banda CEDES Don Bosco examples
import Footer from "examples/Footer";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";

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

const Almuerzos = () => {
  const { loading, error, data } = useQuery(GET_PRODUCTS);
  const [open, setOpen] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState("");

  const [cart, setCart] = useState([]);
  const [selectedQuantities, setSelectedQuantities] = useState({});

  const { data: userData, loading: userLoading, error: userError } = useQuery(GET_USERS_BY_ID);

  const [createOrder, { data: orderData, loading: orderLoading, error: orderError }] = useMutation(
    CREATE_ORDER,
    {
      refetchQueries: [{ query: GET_ORDERS }],
    }
  );

  // Función para actualizar la categoría seleccionada
  const handleCategorySelection = (category) => {
    setSelectedCategory(category);
  };

  if (userLoading) return <p>Cargando información del usuario...</p>;
  if (userError) return <p>Error al obtener la información del usuario: {userError.message}</p>;

  const userId = userData?.getUser?.id;

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error :(</p>;

  const addToCart = (product) => {
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
      // Manejar el error adecuadamente (mostrar un mensaje al usuario, por ejemplo)
    }
  };

  const getImageForCategory = (category) => {
    switch (category) {
      case "Bebidas":
        return Bebida2;
      case "Almuerzo":
        return Almuerzo2;
      case "Postres":
        return Postre2;

      default:
        return Almuerzo2;
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <>
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
            <div className="flex flex-row gap-6 overflow-x-auto lg:grid lg:grid-cols-6  ">
              <div
                onClick={() => handleCategorySelection("")} // Esto resetea el filtrado
                className="text-center space-y-4 cursor-pointer"
              >
                <div className="">
                  <img src={Todos} className="mx-auto w-6/12 h-full" />
                </div>
                <h5 className="text-lg text-default-600">Todos </h5>
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
                    <div
                      key={product.id}
                      className="border border-default-200 rounded-lg p-6 overflow-hidden hover:border-purple-950 transition-all duration-300"
                    >
                      <div className="relative rounded-lg overflow-hidden divide-y divide-default-200">
                        <div className="pt-2 space-y-2">
                          <h6 className=" text-xs text-default-500">{product.category}</h6>

                          <h4 className="text-default-800 text-2xl font-semibold line-clamp-1 mb-2">
                            {product.name}
                          </h4>
                          <h6 className=" text-lg text-default-500">{product.description}</h6>
                        </div>
                        <div className="mt-4 mx-auto">
                          {/* Asumiendo que tienes una forma de determinar la imagen basada en el producto */}
                          <img
                            src={getImageForCategory(product.category)}
                            alt={product.name}
                            className="w-full h-full"
                          />
                        </div>
                        <div className=" pt-4 flex justify-between items-end">
                          <div>
                            <h6 className="text-lg text-default-500">Precio: ₡ {product.price}</h6>

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

                            {/* <div className="flex flex-row ">
                              <h6 className="text-lg text-default-500 mr-2">Cant: </h6>

                              <input
                                type="number"
                                pattern="\d*"
                                min="1"
                                value={selectedQuantities[product.id] || " "}
                                onChange={(e) =>
                                  handleQuantityChange(product.id, parseInt(e.target.value))
                                }
                                className=" w-12 mr-2 border rounded-full  py-1 px-2"
                              />
                            </div> */}
                          </div>

                          <button
                            onClick={() => addToCart(product)}
                            className="bg-black text-white px-6 py-2 text-sm  rounded-2xl"
                          >
                            Añadir
                          </button>
                        </div>
                      </div>
                    </div>
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
                        <div key={product.id} className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <img
                              src={getImageForCategory(product.category)}
                              alt={product.name}
                              className="h-16 w-16 object-cover rounded-full"
                            />
                            <div className="">
                              <a href="" className="text-base font-medium text-default-800">
                                {product.name}
                              </a>
                              <p className="text-sm font-medium text-default-800">x{quantity}</p>
                            </div>
                          </div>
                          <h3 className="text-base font-medium text-default-800">
                            {" "}
                            ₡ {product.price * quantity}
                          </h3>

                          <button
                            onClick={() => removeFromCart(product.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            x
                          </button>
                        </div>
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
                      <h4 className="text-xl text-primary font-semibold">
                        ₡ {cart.reduce((acc, curr) => acc + curr.product.price * curr.quantity, 0)}
                      </h4>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <button
                    className="flex items-center justify-center gap-2 rounded-full border border-l-purple-950 bg-[#293964] px-10 py-4 text-center text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:border-l-purple-950-700 hover:bg-[#293964]-500"
                    onClick={() => userId && submitOrder(userId)}
                    disabled={orderLoading || !userId}
                  >
                    Confirmar Orden
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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
