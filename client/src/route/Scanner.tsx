import React, { useState, useCallback } from 'react';

const QrReader = require('react-qr-reader');
const relativeDate = require('tiny-relative-date').default;
const { MDBAlert, MDBContainer, MDBRow, MDBCol, MDBView, MDBMask, MDBIcon, MDBAnimation, MDBBadge } = require("mdbreact");

const Scanner: React.FC = () => {
  const [gotError, setError] = useState<Error>();
  const [scanHistories, setScanHistories] = useState<Array<{ qrcode:string, scanAt:Date, count:number, total:number }>>([]);

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

  const onScan = (value:string) => {
    if (value == null)   {
      return;
    }

    // if scanned value same as previous value, ignore.
    if (scanned && value === scanned.qrcode) {
      return;
    }

    setScanHistories(prev => {
      return [{ qrcode: value, scanAt: new Date(), count: 1, total: 3 }, ...prev];
    });
  };

  const onError = useCallback(e => { setError(e) }, []);

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
      scanned == null
        ? <MDBAlert color="dark" className="mx-2 mt-2 p-1">
            未スキャン
          </MDBAlert>
        : <MDBAlert color="info" className="mx-2 mt-2 p-1">
            {scanned.qrcode}
          </MDBAlert>
    }
    <MDBView>
      <QrReader showViewFinder={false} onError={onError} onScan={onScan}/>
      <MDBMask pattern={2} onClick={onViewFinderClick} style={{ opacity: '0.7' }}>
        <MDBRow className="justify-content-end">
          <MDBCol size="11">
            {
              scanHistories.map((scan,idx) => {
                const style = scan.count >= scan.total ? 'dark' : 'success';
                return <MDBAnimation key={scan.scanAt.toString()} type="slideInRight" duration="200ms">
                  <MDBAlert className="px-2 py-1 m-1" color={style}>
                    {scan.qrcode}
                    <MDBAnimation type="flash" duration="500ms" key={scan.count} style={{ display: 'inline' }}>
                      <MDBBadge color="info" className="ml-1">済{scan.count}</MDBBadge>
                      <MDBBadge color="warning" className="ml-1">残{scan.total - scan.count}</MDBBadge>
                    </MDBAnimation>
                    <span key={idx}>
                      {scan.scanAt.getHours()}:{scan.scanAt.getMinutes()}:{scan.scanAt.getSeconds()} ({relativeDate(scan.scanAt)})
                    </span>
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
