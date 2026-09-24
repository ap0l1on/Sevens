name: Report a wrong result
description: Tell us when the calculator disagrees with the rules.
title: "[wrong result] "
labels: ["bug"]
body:
  - type: textarea
    id: inputs
    attributes:
      label: Inputs
      description: Paste your share link or list the 6 grades, TOK, EE and CAS.
    validations:
      required: true
  - type: textarea
    id: expected
    attributes:
      label: What you expected
      description: What total or verdict did you expect?
    validations:
      required: true
  - type: textarea
    id: why
    attributes:
      label: Why
      description: Which ibo.org rule says so? Link the page.
    validations:
      required: true
