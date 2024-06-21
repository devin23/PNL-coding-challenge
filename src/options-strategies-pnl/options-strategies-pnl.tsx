import styles from './options-strategies-pnl.module.css';

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

interface OptionStrategy {
    strike_price: number,
    type: 'Call' | 'Put',
    bid: number,
    ask: number,
    long_short: 'long' | 'short',
    expiration_date: string
}

function getPremium(option: OptionStrategy) {
    return option.long_short === 'long'
        ? option.bid
        : option.ask;
}

const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Risk & Reward for Options Strategies',
      },
    },
    scales: {
        y: {
            title: {
                display: true,
                text: 'Profit/Loss',
              }
        },
        x: {
            title: {
                display: true,
                text: 'Underlying Price at Expiry',
              }
        },
    }
};


// calculate the profit and loss for an option
function getPNL(option: OptionStrategy, underlyingPrices: number[]) {
    const optionPremium = getPremium(option);

    if (option.long_short === 'long') {
        if (option.type === 'Call') {
            return underlyingPrices.map(underlyingPrice => Math.max(-optionPremium, underlyingPrice - option.strike_price - optionPremium));
        } else {
            return underlyingPrices.map(underlyingPrice => Math.max(-optionPremium, option.strike_price - underlyingPrice - optionPremium));
        }
    } else {
        if (option.type === 'Call') {
            return underlyingPrices.map(underlyingPrice => Math.min(optionPremium, option.strike_price - underlyingPrice + optionPremium));
        } else {
            return underlyingPrices.map(underlyingPrice => Math.min(optionPremium, underlyingPrice - option.strike_price + optionPremium));
        }
    }
}

const colors = ['blue', 'red', 'green', 'orange']


export default function OptionsStrategiesPNL({options}) {

    let minX;
    let maxX;
    
    options.forEach(option => {
        const premium = getPremium(option);

        minX = Math.min(
            minX || option.strike_price,
            option.type === 'Call' ?  option.strike_price - premium : option.strike_price
        );
        maxX = Math.max(
            maxX || option.strike_price,
            option.type === 'Put' ?  option.strike_price + premium : option.strike_price
        );
    });

    maxX += 10;
    minX = Math.max(0, minX - 10);

    const underLyingPrices = Array.from({length:(maxX - minX) * 100},(v,k)=> +(minX + ((k+1)/100)).toFixed(2))


    const datasets = options.map((option, index) => {

        const pnl = getPNL(option, underLyingPrices);

        return {
            label: `${option.long_short} ${option.type}, Strike Price: ${option.strike_price}, Ask: ${option.ask}, Bid:  ${option.bid}`,
            data: pnl,
            borderColor: colors[index],
            backgroundColor: colors[index],
            fill: false, 
        };
    });

    datasets.push({label: 'Break Even', data: underLyingPrices.map(v => 0)})

    const chartData = {
        datasets,
        labels: underLyingPrices
    };



    return (
        <div className={styles.graph}>
          <Line data={chartData} options={chartOptions}/>
        </div>
      );
}