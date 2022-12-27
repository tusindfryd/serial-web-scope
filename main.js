/* bookmark: https://web.dev/serial/ */

class LineBreakTransformer {
  constructor() {
    // a container for holding stream data until a new line
    this.chunks = "";
  }

  transform(chunk, controller) {
    const eol = document.querySelector(
      'input[name="lineEndings"]:checked'
    ).value;
    let splitBy;
    if (eol === "rn") {
      splitBy = "\r\n";
    } else if (eol === "n") {
      splitBy = "\n";
    }
    // append new chunks to existing chunks
    this.chunks += chunk;
    // for each line breaks in chunks, send the parsed lines out
    const lines = this.chunks.split(splitBy);
    this.chunks = lines.pop();
    lines.forEach((line) => controller.enqueue(line));
  }

  flush(controller) {
    // when the stream is closed, flush any remaining chunks out
    controller.enqueue(this.chunks);
  }
}

let connect = async () => {
  const port = await navigator.serial.requestPort();
  await port.open({
    baudRate: Number(document.querySelector("#baudRate").value),
    bufferSize: 200,
  });
  let decoder = new TextDecoderStream();
  inputDone = port.readable.pipeTo(decoder.writable);
  inputStream = decoder.readable.pipeThrough(
    new TransformStream(new LineBreakTransformer())
  );
  reader = inputStream.getReader();
};

let connectDevice = async () => {
  await connect();
  document.querySelector("#baudRate").disabled = true;
  document.querySelector("#connect").disabled = true;
  [...document.querySelectorAll('input[name="lineEndings"]')].map(
    (el) => (el.disabled = true)
  );
  [...document.querySelectorAll('input[name="dataFormat"]')].map(
    (el) => (el.disabled = true)
  );

  while (true) {
    const { value, done } = await reader.read();
    if (value) {
      document.querySelector('#output').innerText = value;
      const format = document.querySelector(
        'input[name="dataFormat"]:checked'
      ).value;
      if (format === "json") {
        try {
          let reading = JSON.parse(value);
          let date = new Date().toLocaleString("en-US");
          for (let key of Object.keys(reading)) {
            addData(scope, date, key, Number(reading[key]));
          }
        } catch (error) {
          console.log(error);
        }
      } else if (format === "csv") {
        if (!value.includes(",")) {
          let date = new Date().toLocaleString("en-US");
          addData(scope, date, "Channel 1", Number(value));
        } else {
          let values = value.split(",");
          let date = new Date().toLocaleString("en-US");
          for (let v in values) {
            addData(scope, date, `Channel ${v}`, Number(values[v]));
          }
        }
      }
    }
    if (done) {
      // allow the serial port to be closed later
      reader.releaseLock();
      break;
    }
  }
};

let addData = (chart, label, datasetLabel, data) => {
  const windowWidth = Number(document.querySelector("#windowWidth").value);
  chart.data.labels.push(label);
  chart.data.labels = chart.data.labels.slice(-windowWidth);
  let datasets = chart.data.datasets.filter(
    (dataset) => dataset.label == datasetLabel
  );
  datasets.length == 0
    ? chart.data.datasets.push({ label: datasetLabel, data: [] })
    : null;
  datasets = chart.data.datasets.filter(
    (dataset) => dataset.label == datasetLabel
  );
  datasets[0].data.push(data);
  datasets[0].data = datasets[0].data.slice(-windowWidth);
  chart.update("quiet");
};

const scopeConfig = {
  type: "line",
  options: {
    interaction: {
      intersect: false,
    },
    elements: {
      point: {
        radius: 2,
      },
    },
    scales: {
      x: {
        ticks: {
          callback: () => "",
        },
      },
    },
    animation: 0,
    responsive: true,
    plugins: {
      colors: {
        forceOverride: true,
      },
      legend: {
        position: "top",
      },
    },
  },
};

Chart.defaults.font.family = "monospace";
Chart.defaults.borderColor = "#3a3a3a";
Chart.defaults.color = "#eeeeee";
const scope = new Chart(document.querySelector("#scope"), scopeConfig);
