import React, { useState, useEffect } from 'react';

const { MDBAnimation, MDBAlert, MDBCard, MDBCardHeader, MDBCardBody, MDBBtn, MDBContainer, MDBRow, MDBCol, MDBIcon, MDBBadge } = require("mdbreact");
const _ = require('lodash');
const F = React.Fragment;

interface Exhibition {
  id:               string;
  exhibition_name:  string;
}

const ENDPOINT = process.env.NODE_ENV === "production"
  ? window.location.protocol + "//" + window.location.hostname + "/dev/endpoint"
  : window.location.protocol + "//" + window.location.hostname + ":3200/endpoint";

const SampleBook: React.FC = () => {
  const [error, setError] = useState<Error>();
  const [loading, setLoading] = useState<boolean>();
  const [spaceSym, setSpaceSym] = useState<string|null>();
  const [spaceNum, setSpaceNum] = useState<number|null>();
  const [circles, setCircles] = useState<Array<Circle>>([]);
  const [exhibition, setExhibition] = useState<Exhibition | null>();
  const [exhibitions, setExhibitions] = useState<Array<Exhibition>>([]);

  useEffect(() => {
    setLoading(true);
    window.fetch(ENDPOINT, {
      method: "POST",
      body: JSON.stringify({ command: "exhibition.list" }),
    })
    .then(data => data.json())
    .then(data => { setLoading(false); setExhibitions(data) })
    .catch(e => { setLoading(false); setError(e) });
  }, []);

  const onSymSelect = (sym:string) => { setSpaceSym(sym); setSpaceNum(null); };
  const onNumSelect = (num:number) => { setSpaceNum(num) };
  //const onConditionClear = () => { setSpaceSym(null); setSpaceNum(null); };

  const onExhibitionChange = (e:React.FormEvent<HTMLSelectElement>) => {
    const eid = e.currentTarget.value;

    setExhibition(null);
    setCircles([]);

    if (eid === "") {
      // selected empty, so fetch no data
      return;
    }

    console.log("loading data:", eid);
    setLoading(true);

    window.fetch(ENDPOINT, {
      method: "POST",
      body: JSON.stringify({ command: "circle.list", exhibition_id: eid })
    })
    .then(data => data.json())
    .then(data => {
      setLoading(false);
      setExhibition(exhibitions.filter(e => e.id === eid)[0]);
      setCircles(data.circles);
    })
    .catch(e => { setLoading(false); setError(e) });
  };

  const onRegister = () => {
    if (!window.confirm("見本誌提出を行います。よろしいですか？")) {
      return;
    }

    if (selected == null)   {
      return;
    }

    if (exhibition == null) {
      return;
    }

    window.fetch(ENDPOINT, {
      method: "POST",
      body: JSON.stringify({ command: "circle.samplebook", circle_id: selected.id, exhibition_id: exhibition.id })
    })
    .then(data => data.json())
    .then(data => {
      if (data.error)   {
        console.log(data.error);
        alert(`既に見本誌が登録済みです。(err=${data.error.message})`)
      }
      selected.samplebook = true;
      selected.isRefreshed = true;
      setCircles(prev => prev ? [...prev] : []);
    })
    .catch(data => {
      alert(data);
    })
  };

  if (error != null)    {
    return <MDBContainer className="mt-3 text-center">
      <h1 className="mt-2">Error!</h1>
      {error.toString()}
    </MDBContainer>
  }

  const syms: Array<{ sym:string, count:number, checked:number }> = _
    .uniq(circles.map(c => c.space_sym))
    .sort((a:string, b:string) => {
      // TODO: sort order in config
      if( a.charCodeAt(0) < b.charCodeAt(0) ) return -1;
      if( a.charCodeAt(0) > b.charCodeAt(0) ) return 1;
      return 0;
    })
    .map((sym:string) => {
      return {
        sym,
        count: circles.filter(c => c.space_sym === sym).length,
        checked: circles.filter(c => c.space_sym === sym && c.samplebook).length,
      };
    });

  const nums: Array<{ sym:string, num:number, samplebook?:boolean, isRefreshed?:boolean }> = circles
    .filter(c => c.space_sym === spaceSym)
    .sort((a,b) => {
      if( a.space_num < b.space_num ) return -1;
      if( a.space_num > b.space_num ) return 1;
      return 0;
    })
    .map(c => { return { sym: c.space_sym, num: c.space_num, samplebook: c.samplebook, isRefreshed: c.isRefreshed }; });


  const checked = circles.filter(c => c.samplebook).length;
  const selected = spaceSym && spaceNum
    ? circles.filter(c => c.space_sym === spaceSym && c.space_num === spaceNum)[0]
    : null;

  return <MDBContainer className="mt-3">
    <MDBRow>
      <MDBCol size="12">
        <MDBBtn size="sm" href="/" className="float-right">
          <MDBIcon icon="bars"/> トップへ戻る
        </MDBBtn>
      </MDBCol>
      <MDBCol size="12">
        <MDBCard>
          <MDBCardHeader color={selected ? "success-color" : "teal darken-3"}>
            <MDBIcon icon="book"/> 見本誌提出
            <div className="float-right">
              @mogemogefugafuga
            </div>
          </MDBCardHeader>
          {
            exhibitions.length !== 0 && <MDBCardBody>
              <select className="browser-default custom-select" onChange={onExhibitionChange}>
                <option value="">即売会を選択してください</option>
                {
                  exhibitions.map(e => <option value={e.id}>{e.exhibition_name} ({e.id})</option>)
                }
              </select>
            </MDBCardBody>
          }
        </MDBCard>
      </MDBCol>
    </MDBRow>
    {
      exhibition && <MDBRow className="mt-3">
        <MDBCol size="12">
          <MDBAlert color="success">
            選択中：{exhibition.exhibition_name}
            <MDBBadge color="warning" className="ml-2 mr-1"><MDBIcon icon="check"/> {checked}</MDBBadge>
            <MDBBadge color="info" className="mx-1"><MDBIcon icon="list"/> {circles.length}</MDBBadge>
            <MDBBadge color="light" className="mx-1"><MDBIcon icon="chart-pie"/> {Math.floor(checked / circles.length * 1000) / 10}%</MDBBadge>
          </MDBAlert>
        </MDBCol>
      </MDBRow>
    }
    {
      circles.length !== 0 && <MDBRow>
        <MDBCol size="4">
          <div>
            <h4>1. 記号！</h4>
            {
              syms.map(s => {
                const style = (() => {
                  if (spaceSym === undefined) { return "success"; } // not selected
                  if (s.count === s.checked)  { return "blue-grey"; } // all samplebook checked
                  return s.sym === spaceSym
                    ? "success"
                    : "teal accent-3";
                })();

                return <MDBBtn block
                  size="lg"
                  key={s.sym}
                  color={style}
                  onClick={onSymSelect.bind(null,s.sym)}
                  className="px-3 mb-2 text-monospace">
                    {s.sym}
                    {
                      s.count === s.checked
                        ? <MDBBadge color="light" className="mx-1"><MDBIcon icon="check"/> {s.count}</MDBBadge>
                        : <F>
                            <MDBBadge color="warning" className="ml-2 mr-1"><MDBIcon icon="check"/> {s.checked}</MDBBadge>
                            <MDBBadge color="info" className="mx-1"><MDBIcon icon="bars"/> {s.count}</MDBBadge>
                          </F>
                    }
                </MDBBtn>
              })
            }
          </div>
        </MDBCol>
        <MDBCol size="5">
          <div>
            <h4>2. 番号！</h4>
            {
              nums.map(s => {
                const style = (() => {
                  if (!spaceNum) { return "success"; }
                  return s.num === spaceNum
                    ? "success"
                    : "teal accent-3";
                })();

                const button = <MDBBtn rounded
                  size="lg"
                  key={s.num}
                  color={style}
                  onClick={onNumSelect.bind(null,s.num)}
                  className="px-4 mt-0 mb-2 text-monospace">
                    {
                      s.samplebook
                        ? <MDBIcon icon="check" className="mr-1"/>
                        : <MDBIcon far icon="square" className="mr-1"/>
                    }
                    {s.sym}-{('00' + s.num).slice(-2)}
                </MDBBtn>;

                return s.isRefreshed
                  ? <MDBAnimation type="flash" duration="500ms" style={{ display: "inline" }}>{button}</MDBAnimation>
                  : button;
              })
            }
          </div>
        </MDBCol>
        <MDBCol size="3">
          <h4>3. 提出！</h4>
            {
              selected
                ? <div className="mt-3">
                    <h4>{spaceSym + "" + spaceNum}</h4>
                    {selected.circle_name}<br/>
                    ({selected.penname})
                    <hr/>
                  </div>
                : ""
            }
            <MDBBtn block
              size="lg"
              color="primary"
              disabled={!selected || selected.samplebook}
              onClick={onRegister}>
                {
                  !selected
                    ? "スペースを選択してください"
                    : selected.samplebook
                      ? <F><MDBIcon icon="check"/> 提出済みです</F>
                      : <F><MDBIcon icon="cloud-upload-alt"/> 見本誌提出</F>
                }
            </MDBBtn>
        </MDBCol>
      </MDBRow>
    }
    {
      loading &&
        <MDBContainer className="mt-5 text-center">
          <div className="spinner-border text-success" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <h1 className="mt-2">Loading...</h1>
        </MDBContainer>
    }
  </MDBContainer>;
}

export default SampleBook;
