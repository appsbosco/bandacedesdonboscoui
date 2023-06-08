import React, { useState } from "react";
import { Form, Formik, FormikConfig } from "formik";
import SoftBox from "components/SoftBox";
import { Button } from "@mui/material";
import PropTypes from "prop-types";

const MultiStepForm = ({ children, initialValues, onSubmit }) => {
  const [page, setPage] = useState(0);
  const steps = React.Children.toArray(children);

  const [snapshot, setSnapshot] = useState(initialValues);

  const step = steps[page];
  const totalSteps = steps.length;
  const isLastStep = page === totalSteps - 1;

  const next = (values) => {
    setPage(page + 1);
    setSnapshot({ ...snapshot, ...values });
  };
  const back = (values) => {
    setPage(page - 1);
    setSnapshot({ ...snapshot, ...values });
  };

  const handleSubmit = async (values, actions) => {
    if (step.props.onSubmit) {
      await step.props.onSubmit(values);
    }
    if (isLastStep) {
      onSubmit(values, actions);
    } else {
      actions.setTouched({});
      next(values);
    }
  };

  return (
    <div>
      <Formik
        initialValues={snapshot}
        onSubmit={handleSubmit}
        validationSchema={step.props.validationSchema}
      >
        {(formik) => (
          <Form style={{ width: "100%" }}>
            {step}

            <SoftBox mt={4} mb={1}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                {page > 0 && (
                  <Button
                    onClick={() => back(formik.values)}
                    variant="gradient"
                    sx={{
                      width: "50%",
                      color: "#ffffff",
                      marginRight: "1rem",

                      "&:hover": {
                        bgcolor: "primary.dark",
                        color: "white",
                      },
                    }}
                    className="inline-flex items-center rounded-full gap-2.5 justify-center px-7 py-3 font-semibold leading-none outline-offset-2 transition-all duration-200 ease-in-out active:transition-none bg-slate-900 text-white hover:bg-sky-800 w-full text-base sm:text-lg"
                    style={{
                      backgroundColor: "white",
                      color: "rgb(15 23 42 / var(--tw-bg-opacity))",
                    }}
                  >
                    Atrás
                  </Button>
                )}
                <Button
                  type="submit"
                  variant="gradient"
                  disabled={formik.isSubmitting}
                  className="inline-flex items-center rounded-full gap-2.5 justify-center px-7 py-3 font-semibold leading-none outline-offset-2 transition-all duration-200 ease-in-out active:transition-none bg-slate-900 text-white hover:bg-sky-800 w-full text-base sm:text-lg"
                  style={{
                    backgroundColor: "rgb(15 23 42 / var(--tw-bg-opacity))",
                    color: "white",
                  }}
                >
                  {isLastStep ? "Enviar" : "Siguiente"}
                </Button>
              </div>
            </SoftBox>
          </Form>
        )}
      </Formik>
    </div>
  );
};

MultiStepForm.propTypes = {
  children: PropTypes.node.isRequired,
  initialValues: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
};

export default MultiStepForm;

export const FormStep = ({ stepName = "", children }) => children;
