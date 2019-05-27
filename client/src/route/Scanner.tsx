import React, { useState, useCallback } from 'react';

const F = React.Fragment;
const QrReader = require('react-qr-reader');
const relativeDate = require('tiny-relative-date').default;
const { MDBAlert, MDBContainer, MDBRow, MDBCol, MDBView, MDBMask, MDBIcon, MDBAnimation, MDBBadge } = require("mdbreact");

interface ScanState {
  scanValue:    string;
  scanAt:       Date;
  circle?:      Circle;
  fetched?:     boolean;
}

interface ScanResult {
  qrcode:   string;
  scanAt:   Date;
  count:    number;
  total:    number;
  circle:   Circle;
}

const Scanner: React.FC = () => {
  const [gotError, setError] = useState<Error>();
  const [lastScanned, setLastScanned] = useState<ScanState>();
  const [scanHistories, setScanHistories] = useState<Array<ScanResult>>([]);

  // fetch last scanned data
  const scanned = scanHistories.length === 0
    ? null
    : scanHistories[0];

  // events
  const onViewFinderClick = () => {
    if (scanned == null)    {
      alert("スキャンを行ってください。");
      return;
    }

    setScanHistories(prev => {
      const matched = prev.filter(s => s.qrcode === scanned.qrcode);
      if (matched.length === 0) {
        alert("なんでか知らんが一致するサークルがいない");
        return prev;
      }

      const m = matched[0];
      if (m.count >= m.total) {
        alert("全て発券済みです。");
        return prev;
      }

      m.count = m.count + 1;
      return [...prev];
    });
  };

  const onScan = (scanValue:string) => {
    if (scanValue == null)   {
      return;
    }

    if (lastScanned != null && !lastScanned.fetched) {
      // ignore when accessing to api (protect duplicate scan)
      return;
    }

    if (scanned && scanValue === scanned.qrcode) {
      // scan value is same as before scan
      setLastScanned(prev => {
        return { ...prev, scanValue, scanAt: new Date() }; // value is same: keep fetch data
      });

      return;
    } else {
      setLastScanned(prev => {
        return { scanValue, scanAt: new Date() }; // value is not same: discard fetch data
      });
    }

    window.fetch(window.location.protocol + "//" + window.location.hostname + ":3200/endpoint", {
      method: "POST",
      body: JSON.stringify({ command: "circle.admission", serial: scanValue }),
    })
    .then(data => data.json())
    .then(data => {
      setLastScanned(prev => {
        if (prev == null) { return prev; }
        return { ...prev, fetched: true, circle: data.circle };
      });

      if (data.status === "accepted") {
        setScanHistories(prev => {
          return [
            {
              qrcode: scanValue,
              scanAt: new Date(),
              count: data.used,
              total: data.max,
              circle: data.circle,
            },
            ...prev
          ];
        });

        return;
      }

      if (data.status === "limit_exceed") {
        setScanHistories(prev => {
          return [
            {
              qrcode: scanValue,
              scanAt: new Date(),
              count: data.max,
              total: data.max,
              circle: data.circle,
            },
            ...prev
          ];
        });

        return;
      }

      alert("unknown data" + JSON.stringify(data));
    })
    .catch(e => { alert(e) });
  };

  const onError = useCallback(e => { setError(e) }, []);
  const animateFlash = useCallback((action:string, color:string, key:string, elem:any) => {
    return <MDBAnimation type={action}  duration="300ms" key={key}>
      <MDBAlert color={color} className="m-2 p-1">
        {elem}
      </MDBAlert>
    </MDBAnimation>
  }, []);

  if (gotError) {
    return <MDBContainer fluid className="pt-2">
      <MDBAlert color="danger">
        <h4><MDBIcon icon="exclamation-circle" className="mr-1"/>カメラを起動できません。</h4>
        カメラの使用許可ダイアログにて拒否を選択したか、ブラウザが対応していません。
        <hr/>
        {gotError.toString()}
      </MDBAlert>
    </MDBContainer>;
  }

  return <MDBContainer fluid className="p-0 my-2">
    <MDBAlert color="success" className="mx-2 my-0">
      <h5><MDBIcon icon="qrcode"/> 通行証QRコード読み込み</h5>
    </MDBAlert>
    {
      lastScanned == null
        ? <MDBAlert color="dark" className="m-2 p-1">スキャンしてください</MDBAlert>
        : <F>{ animateFlash("pulse", "info", lastScanned.scanValue + "//" + lastScanned.scanAt.getTime(), `読み取り値 (${lastScanned.scanValue})`) }</F>
    }
    {(() => {
      if (lastScanned == null) {
        return <MDBAlert color="dark" className="m-2 p-1">スキャン後、サークルの情報が表示されます。</MDBAlert>;
      }

      if (!lastScanned.fetched) {
        return animateFlash("flash", "dark", "loading", "サークル情報を取得中...");
      }

      if (lastScanned.circle == null) {
        return <div>わからん</div>;
      }

      const circle = lastScanned.circle;
      return animateFlash("flash", "success", lastScanned.scanValue, `${circle.circle_name} / ${circle.penname}`);
    })()}
    <MDBView>
      <QrReader delay={400} showViewFinder={false} onError={onError} onScan={onScan}/>
      <MDBMask pattern={2} onClick={onViewFinderClick} style={{ opacity: '0.6' }}>
        <MDBRow className="justify-content-end">
          <MDBCol size="12">
            {
              scanHistories.map((scan,idx) => {
                const style = scan.count >= scan.total ? 'danger' : 'success';
                const circle = scan.circle;
                return <MDBAnimation key={scan.scanAt.toString()} type="slideInRight" duration="200ms">
                  <MDBAlert className="px-2 py-1 m-1" color={style}>
                    <MDBAnimation type="flash" duration="500ms" key={scan.count} style={{ display: 'inline' }}>
                      {
                        scan.count >= scan.total &&
                          <MDBBadge color="danger" className="mx-1"><MDBIcon icon="exclamation"/> 全て発券済</MDBBadge>
                      }
                      {
                        scan.count < scan.total &&
                          <MDBBadge color="info" className="mx-1"><MDBIcon icon="ticket-alt"/> 残{scan.total - scan.count}枚</MDBBadge>
                      }
                      {circle.circle_name}
                      <span key={idx}>
                        {scan.scanAt.getHours()}:{scan.scanAt.getMinutes()}:{scan.scanAt.getSeconds()} ({relativeDate(scan.scanAt)})
                      </span>
                    </MDBAnimation>
                  </MDBAlert>
                </MDBAnimation>
              })
            }
          </MDBCol>
        </MDBRow>
      </MDBMask>
    </MDBView>
  </MDBContainer>;
}

export default Scanner;
