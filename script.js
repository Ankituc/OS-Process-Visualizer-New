let processes = [];
let chartInstance = null; 

function toggleInputs() {
    let algorithm = document.getElementById("algorithm").value;
    document.getElementById("priorityLabel").classList.toggle("hidden", algorithm !== "Priority");
    document.getElementById("priority").classList.toggle("hidden", algorithm !== "Priority");
    document.getElementById("quantumLabel").classList.toggle("hidden", algorithm !== "RoundRobin");
    document.getElementById("quantum").classList.toggle("hidden", algorithm !== "RoundRobin");
}

function addProcess() {
    let arrival = parseInt(document.getElementById("arrival").value);
    let burst = parseInt(document.getElementById("burst").value);
    let priority = document.getElementById("priority").value ? parseInt(document.getElementById("priority").value) : null;

    if (isNaN(arrival) || isNaN(burst) || burst <= 0) {
        alert("Enter valid values!");
        return;
    }

    let process = { id: "P" + (processes.length + 1), arrival, burst, priority };
    processes.push(process);
    displayProcesses();
}

function displayProcesses() {
    let table = document.getElementById("processTable");
    table.innerHTML = `<tr>
        <th>Process ID</th>
        <th>Arrival Time</th>
        <th>Burst Time</th>
        <th>Completion Time</th>
        <th>Turnaround Time</th>
        <th>Waiting Time</th>
    </tr>`;

    processes.forEach(p => {
        let row = table.insertRow();
        row.insertCell(0).innerText = p.id;
        row.insertCell(1).innerText = p.arrival;
        row.insertCell(2).innerText = p.burst;
    });
}

function runScheduler() {
    if (processes.length === 0) {
        alert("No processes added!");
        return;
    }

    let algorithm = document.getElementById("algorithm").value;
    let results = [];

    if (algorithm === "FCFS") results = fcfs();
    else if (algorithm === "SJF") results = sjf();
    else if (algorithm === "RoundRobin") results = roundRobin();
    else if (algorithm === "Priority") results = priorityScheduling();

    processes = results;
    displayResults();
    visualizeGanttChart();
    visualizeGraph();
}

function fcfs() {
    let sorted = [...processes].sort((a, b) => a.arrival - b.arrival);
    return calculateCompletion(sorted);
}

function sjf() {
    let sorted = [...processes].sort((a, b) => (a.arrival - b.arrival) || (a.burst - b.burst));
    return calculateCompletion(sorted);
}

function roundRobin() {
    let quantum = parseInt(document.getElementById("quantum").value);
    let queue = [...processes].sort((a, b) => a.arrival - b.arrival);
    let time = 0, results = [];
    let remainingBurst = queue.map(p => ({ ...p, remaining: p.burst }));

    while (remainingBurst.length > 0) {
        let p = remainingBurst.shift();
        let executeTime = Math.min(p.remaining, quantum);
        p.remaining -= executeTime;
        time += executeTime;

        if (p.remaining > 0) {
            remainingBurst.push(p);
        } else {
            results.push({ ...p, completion: time, turnaround: time - p.arrival, waiting: time - p.arrival - p.burst });
        }
    }
    return results;
}

function priorityScheduling() {
    let sorted = [...processes].sort((a, b) => (a.arrival - b.arrival) || (a.priority - b.priority));
    return calculateCompletion(sorted);
}

function calculateCompletion(sortedProcesses) {
    let time = 0, results = [];
    sortedProcesses.forEach(p => {
        time = Math.max(time, p.arrival) + p.burst;
        let turnaround = time - p.arrival;
        let waiting = turnaround - p.burst;
        results.push({ ...p, completion: time, turnaround, waiting });
    });
    return results;
}

function displayResults() {
    displayProcesses();
    let table = document.getElementById("processTable");

    processes.forEach((p, index) => {
        let row = table.rows[index + 1];
        row.insertCell(3).innerText = p.completion;
        row.insertCell(4).innerText = p.turnaround;
        row.insertCell(5).innerText = p.waiting;
    });
}

function visualizeGanttChart() {
    let gantt = document.getElementById("gantt-chart");
    gantt.innerHTML = "";

    let time = 0;
    processes.forEach(p => {
        let box = document.createElement("div");
        box.className = "gantt-box";
        box.innerText = `${p.id} (${time} - ${p.completion})`;
        gantt.appendChild(box);
        time = p.completion;
    });
}

function visualizeGraph() {
    let ctx = document.getElementById("chart").getContext("2d");
    let labels = processes.map(p => p.id);
    let completionTimes = processes.map(p => p.completion);
    let turnaroundTimes = processes.map(p => p.turnaround);
    let waitingTimes = processes.map(p => p.waiting);

    if (chartInstance) chartInstance.destroy();
    chartInstance = new Chart(ctx, {
        type: "bar",
        data: {
            labels,
            datasets: [
                { label: "Completion Time", data: completionTimes, backgroundColor: "blue" },
                { label: "Turnaround Time", data: turnaroundTimes, backgroundColor: "green" },
                { label: "Waiting Time", data: waitingTimes, backgroundColor: "red" }
            ]
        }
    });
}

function resetProcesses() {
    processes = [];
    displayProcesses();
    document.getElementById("gantt-chart").innerHTML = ""; // Clear Gantt chart

    if (chartInstance) {
        chartInstance.destroy(); // Destroy the chart instance to reset
        chartInstance = null;
    }
}
