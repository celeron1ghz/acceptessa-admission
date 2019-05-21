const ua = require('superagent');
const fs = require('fs').promises;

(async () => {
  const data = [];

  for (const eid of ['7fes8th', 'nijisanji02']) {
    const ret = await ua.get(`https://data.familiar-life.info/${eid}.json`);
    const e = ret.body.exhibition;

    data.push({
      id: e.id,
      parent: 'exhibition',
      data_key: 'exhibition_name',
      data_value: e.exhibition_name
    });

    for (const c of ret.body.circles) {
      data.push({
        id: c.circle_id,
        parent: eid,
        data_key: 'circle_name',
        data_value: c.circle_name,
      },{
        id: c.circle_id,
        parent: eid,
        data_key: 'penname',
        data_value: c.penname,
      },{
        id: c.circle_id,
        parent: eid,
        data_key: 'space_sym',
        data_value: c.space_sym,
      },{
        id: c.circle_id,
        parent: eid,
        data_key: 'space_num',
        data_value: c.space_num,
      });
    }
  }

  await fs.writeFile("dev/circle.json", JSON.stringify(data, null, 2));
})();


