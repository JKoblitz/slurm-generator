# Slurm script generator

Simple one page application to generate slurm scripts from scratch. 

## Usage
No usage explanation necessary, everything is shown on the page.

## Modify
When reusing this tool for your own application, please adjust the Queue options as well as the ressource limits, according to your SLURM configuration. Queue options must be modified in the `index.html`, limits and error messages can be found in the form validation part in the beginning of `js/script.js`.

You must also update the Mail server in the first lines of `js/script.js`. Leave empty if users should add their whole mail address.