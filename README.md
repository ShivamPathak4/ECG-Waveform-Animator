ECG Waveform Animator (Custom Beats)
This is a React-based web application that simulates an Electrocardiogram (ECG) waveform. It allows users to adjust various parameters of the ECG waves (P, QRS complex, T wave) and observe the changes in real-time. Additionally, it supports defining custom beat sequences, enabling the simulation of irregular heart rhythms.

Features
Real-time ECG Waveform Display: Animates a continuous ECG waveform on an SVG canvas with a grid background.

Adjustable Wave Parameters: Control the height and breadth of P, Q, R, S, and T waves, as well as the lengths of PQ, ST, and TP segments.

Heart Rate Control: Dynamically change the heart rate (beats per minute) to see its effect on the waveform speed.

Dynamic R and P Wave Patterns: Configure patterns to show different numbers of P or R waves after a specified interval of normal QRS complexes, useful for simulating heart blocks or other arrhythmias.

Custom Beat Sequences: Define a sequence of custom beats with unique wave parameters. The animator can then cycle through these custom beats after a configurable number of normal beats, allowing for advanced arrhythmia simulation.

Responsive Design: The layout adjusts for different screen sizes, with controls optimized for both desktop and mobile views.

Modular Codebase: Organized into React components and custom hooks for better maintainability and separation of concerns.

Technologies Used
React: Frontend library for building user interfaces.

TypeScript: Superset of JavaScript that adds static typing.

Tailwind CSS: A utility-first CSS framework for rapid UI development.

SVG: Used for rendering the dynamic ECG waveform.

Project Structure
The project follows a component-based and hook-based architecture for clear separation of concerns:

src/
├── App.tsx             # Root component, renders ECGGenerator
├── components/
│   ├── ECGCanvas.tsx   # Renders the SVG canvas and uses animation hook
│   ├── ECGControls.tsx # Handles all input controls and custom beat logic
│   └── ECGGenerator.tsx# Main component, orchestrates controls and canvas
├── hooks/
│   ├── useECGAnimation.ts    # Manages SVG drawing, grid, and animation loop
│   └── useECGWaveformData.ts # Generates numerical waveform data points
└── types/
    └── ecg.d.ts        # TypeScript interface definitions for data structures

Setup and Installation
To run this project locally, follow these steps:

Clone the repository:

git clone <repository-url>
cd <repository-directory>

(Replace <repository-url> and <repository-directory> with your actual repository information)

Install dependencies:

npm install
# or
yarn install

Start the development server:

npm start
# or
yarn start

This will open the application in your browser, usually at http://localhost:3000.

Usage
Adjust Wave Parameters: Use the sliders and input fields in the "Controls Panel" to modify the basic shape of the P, QRS, and T waves.

Control Heart Rate: Change the "Heart Rate (bpm)" to speed up or slow down the animation.

Experiment with Dynamic Patterns: Enable "Dynamic R Wave Pattern" or "Dynamic P Wave Pattern" to introduce abnormalities. Adjust the "Waves in Pattern" and "Apply After N QRS" values to control their frequency and type.

Create Custom Beat Sequences:

Check "Enable Custom Beat Sequence".

Click "+ Add Custom Beat" to add new custom beat configurations.

Modify the parameters for each custom beat.

Set "Normal Beats Before Repeat" to define how many normal beats occur before the custom beat sequence repeats.

Click "Apply Changes" to see the updated waveform.

Observe the Waveform: The ECG waveform will continuously animate on the right-hand side of the screen, reflecting your parameter adjustments in real-time.

Contributing
Feel free to fork the repository, make improvements, and submit pull requests. For major changes, please open an issue first to discuss what you would like to change.
