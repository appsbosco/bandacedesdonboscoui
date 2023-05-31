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
          <Form>
            {step}

            <SoftBox mt={4} mb={1}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                {page > 0 && (
                  <Button
                    onClick={() => back(formik.values)}
                    variant="gradient"
                    sx={{
                      backgroundImage: "linear-gradient(to left, #293964, #4573DB)",
                      width: "50%",
                      color: "#ffffff",
                      marginRight: "1rem",

                      "&:hover": {
                        bgcolor: "primary.dark",
                        color: "white",
                      },
                    }}
                  >
                    Atrás
                  </Button>
                )}
                <Button
                  type="submit"
                  variant="gradient"
                  disabled={formik.isSubmitting}
                  sx={{
                    backgroundImage: "linear-gradient(to left, #293964, #4573DB)",
                    width: "50%",
                    marginLeft: "auto",
                    color: "#ffffff",
                    "&:hover": {
                      bgcolor: "primary.dark",
                      color: "white",
                    },
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
