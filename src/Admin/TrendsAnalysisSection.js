import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { Scatter } from 'react-chartjs-2';
import Chart from 'chart.js/auto';
import { db } from '../firebaseConfig'; // your initialized Firestore

function TrendsAnalysisSection() {
  const [phqStats, setPhqStats] = useState({
    mae: 0,
    points: [], // { actual, predicted }[]
  });
  const [gadStats, setGadStats] = useState({
    mae: 0,
    points: [],
  });

  useEffect(() => {
    async function fetchDeepResults() {
      const snap = await getDocs(collection(db, 'coupang_deep'));
      const phqPoints = [];
      const gadPoints = [];

      snap.docs.forEach(doc => {
        const data = doc.data();
        const preds = data.phq2_prediction || [];
        const actuals = data.actual_phq2_scores || [];
        preds.forEach((p, i) => {
          if (actuals[i] !== undefined) {
            phqPoints.push({ actual: actuals[i], predicted: p });
          }
        });
        const gpreds = data.gad2_prediction || [];
        const gacts  = data.actual_gad2_scores  || [];
        gpreds.forEach((p, i) => {
          if (gacts[i] !== undefined) {
            gadPoints.push({ actual: gacts[i], predicted: p });
          }
        });
      });

      // Mean Absolute Error
      const phqMae = phqPoints.length
        ? phqPoints.reduce((sum, pt) => sum + Math.abs(pt.predicted - pt.actual), 0) / phqPoints.length
        : 0;
      const gadMae = gadPoints.length
        ? gadPoints.reduce((sum, pt) => sum + Math.abs(pt.predicted - pt.actual), 0) / gadPoints.length
        : 0;

      setPhqStats({ mae: phqMae, points: phqPoints });
      setGadStats({ mae: gadMae, points: gadPoints });
    }
    fetchDeepResults();
  }, []);

  const scatterOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: ctx => `실제: ${ctx.parsed.x}, 예측: ${ctx.parsed.y}`
        }
      }
    },
    scales: {
      x: {
        title: { display: true, text: 'Actual Score' },
        min: 0, max: 5
      },
      y: {
        title: { display: true, text: 'Predicted Score' },
        min: 0, max: 5
      }
    }
  };

  const phqData = {
    datasets: [{
      label: 'PHQ-2 Actual vs Predicted',
      data: phqStats.points.map(pt => ({ x: pt.actual, y: pt.predicted })),
      pointRadius: 4,
      backgroundColor: 'rgba(255,99,132,0.7)'
    }]
  };
  const gadData = {
    datasets: [{
      label: 'GAD-2 Actual vs Predicted',
      data: gadStats.points.map(pt => ({ x: pt.actual, y: pt.predicted })),
      pointRadius: 4,
      backgroundColor: 'rgba(0,0,0,0.4))'
    }]
  };

  return (
    <section style={{ marginTop: 40 }}>
      <h2 className="section-header">예측 vs 실제 정확도</h2>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <div
          style={{
            flex: '1 1 200px',
            padding: 16,
            borderRadius: 8,
            background: 'rgba(0,0,0,0.4)',
            textAlign: 'center'
          }}
        >
          <h3>PHQ-2 평균 절대 오차</h3>
          <p style={{ fontSize: '1.5rem', margin: 0 }}>{phqStats.mae.toFixed(2)}</p>
        </div>
        <div
          style={{
            flex: '1 1 200px',
            padding: 16,
            borderRadius: 8,
            background: 'rgba(0,0,0,0.4)',
            textAlign: 'center'
          }}
        >
          <h3>GAD-2 평균 절대 오차</h3>
          <p style={{ fontSize: '1.5rem', margin: 0 }}>{gadStats.mae.toFixed(2)}</p>
        </div>
        
      </div>

      <div style={{ display: 'flex', gap: 40, marginTop: 30, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 400px' }}>
          <h4>PHQ-2 Actual vs Predicted Scatter</h4>
          <Scatter data={phqData} options={scatterOptions} />
        </div>
        <div style={{ flex: '1 1 400px' }}>
          <h4>GAD-2 Actual vs Predicted Scatter</h4>
          <Scatter data={gadData} options={scatterOptions} />
        </div>
      </div>
    </section>
  );
}

export default TrendsAnalysisSection;
