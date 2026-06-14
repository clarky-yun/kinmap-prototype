const viewModes = [
  {
    id: "house",
    label: "双系 / 家屋",
    title: "家屋网络总览",
    focus: "家屋、婚姻联盟、分家与承屋权一起看",
    types: ["house", "marriage", "inheritance", "adoption"],
    listLabel: "户列表",
    unitLabel: "户",
  },
  {
    id: "patrilineal",
    label: "父系",
    title: "父系房支谱系",
    focus: "按房支与分家代数排列，突出祖屋、分家与承继线",
    types: ["patrilineal", "inheritance", "marriage"],
    listLabel: "父系户",
    unitLabel: "户",
  },
  {
    id: "matrilineal",
    label: "母系",
    title: "母系女性网络",
    focus: "以女性、子女与外家支持为中心，不再把家屋当成主节点",
    types: ["motherChild", "sister", "support", "marriageMove", "uncleCare"],
    listLabel: "女性网络",
    unitLabel: "人",
  },
];

const relationTypes = {
  patrilineal: { label: "父系分家", color: "#1f4b73", dash: "" },
  matrilineal: { label: "母系联系", color: "#b14d45", dash: "10 9" },
  marriage: { label: "婚姻联盟", color: "#b78033", dash: "4 8" },
  house: { label: "家屋关联", color: "#647a3f", dash: "" },
  inheritance: { label: "承屋 / 继承", color: "#5f3d8f", dash: "" },
  adoption: { label: "收养 / 过继", color: "#0f766e", dash: "2 8" },
  motherChild: { label: "母子关系", color: "#b14d45", dash: "" },
  sister: { label: "姐妹线", color: "#d97706", dash: "8 8" },
  support: { label: "娘家支持", color: "#0f766e", dash: "2 8" },
  marriageMove: { label: "婚入 / 婚出", color: "#9a3412", dash: "4 8" },
  uncleCare: { label: "舅甥照护", color: "#4338ca", dash: "10 6" },
};

const laneNames = ["上寨", "中寨", "下寨"];
const branchNames = ["长房", "二房", "三房", "旁支"];
const housePatterns = ["分家户", "并居户", "迁入户", "守屋户"];
const surnames = ["木", "和", "李", "周", "杨", "赵"];

function createVillageData() {
  const households = [];
  const relations = [];
  let personId = 1;
  let relationId = 1;

  for (let i = 0; i < 54; i += 1) {
    const cluster = Math.floor(i / 18);
    const row = Math.floor((i % 18) / 3);
    const col = i % 3;
    const branch = branchNames[(i + cluster) % branchNames.length];
    const surname = surnames[(cluster + col) % surnames.length];
    const members = [];
    const generation = row + 1;
    const baseCode = String(i + 1).padStart(2, "0");

    const grandfather = makeMember(`${surname}阿公${baseCode}`, "男", 78 - (i % 6), "祖辈", "守祖屋，掌祭祀");
    const grandmother = makeMember(`${surname}阿婆${baseCode}`, "女", 73 - (i % 5), "祖辈", "掌灶与家产记忆");
    const father = makeMember(`${surname}父${baseCode}`, "男", 55 - (i % 7), "户主", "负责耕地与议事");
    const mother = makeMember(`${surname}母${baseCode}`, "女", 50 - (i % 6), "配偶", "婚入，维持外家往来");

    members.push(grandfather, grandmother, father, mother);

    const childCount = 2 + (i % 3);
    const childIds = [];

    for (let c = 0; c < childCount; c += 1) {
      const child = makeMember(
        `${surname}${c % 2 === 0 ? "子" : "女"}${baseCode}-${c + 1}`,
        c % 2 === 0 ? "男" : "女",
        26 - c * 4 - (i % 3),
        c === 0 ? "继承候选" : "子代",
        c === 0 ? "被视为下一代承屋人" : "与外村婚配可能较高"
      );
      childIds.push(child.id);
      members.push(child);
    }

    father.childrenIds = [...childIds];
    mother.childrenIds = [...childIds];
    grandmother.childrenIds = [father.id];

    const household = {
      id: `H${i + 1}`,
      name: `${surname}家屋 ${baseCode}`,
      shortName: `${surname}${baseCode}`,
      lane: laneNames[cluster],
      branch,
      pattern: housePatterns[i % housePatterns.length],
      region: cluster === 0 ? "北坡" : cluster === 1 ? "河谷" : "梯田边",
      notes:
        cluster === 0
          ? "与祖屋的祭祀联系较强，婚姻联盟多在本村北片展开。"
          : cluster === 1
            ? "在灌溉与分家问题上更强调协作，出现并居与再分配。"
            : "与外村通婚更密集，常通过女儿与姻亲网络维系资源。",
      memberCount: members.length,
      x: 180 + col * 420 + (row % 2) * 28 + cluster * 60,
      y: 140 + row * 130 + cluster * 36,
      members,
      tags: [branch, laneNames[cluster], housePatterns[i % housePatterns.length]],
      keyHouse: i % 9 === 0,
      generation,
      branchIndex: branchNames.indexOf(branch),
      cluster,
      patrilineOriginId: null,
      patriarchId: father.id,
      grandmotherId: grandmother.id,
      motherId: mother.id,
      daughterIds: members.filter((member) => member.gender === "女" && member.role === "子代").map((member) => member.id),
      sonIds: members.filter((member) => member.gender === "男" && member.role !== "祖辈" && member.id !== father.id).map((member) => member.id),
    };

    members.forEach((member) => {
      member.householdId = household.id;
      member.residenceHouseId = household.id;
    });

    households.push(household);

    function makeMember(name, gender, age, role, note) {
      const member = {
        id: `P${personId}`,
        name,
        gender,
        age,
        role,
        note,
      };
      personId += 1;
      return member;
    }
  }

  const byBranch = new Map();
  households.forEach((household) => {
    const key = `${household.lane}-${household.branch}`;
    const list = byBranch.get(key) ?? [];
    list.push(household);
    byBranch.set(key, list);
  });

  byBranch.forEach((houses) => {
    houses.sort((a, b) => a.generation - b.generation || a.id.localeCompare(b.id));
    houses.forEach((household, index) => {
      household.patrilineOriginId = index > 0 ? houses[index - 1].id : null;
      household.patrilineRootId = houses[0].id;
    });
  });

  households.forEach((household, index) => {
    const nextBranch = households[index + 3];
    const acrossCluster = households[(index + 18) % households.length];
    const branchMate = household.patrilineOriginId
      ? households.find((candidate) => candidate.id === household.patrilineOriginId)
      : null;

    if (branchMate) {
      relations.push({
        id: `R${relationId++}`,
        from: branchMate.id,
        to: household.id,
        type: "patrilineal",
        strength: 0.96,
        note: "同一父系房支的分家线",
      });
    }

    if (nextBranch && household.lane === nextBranch.lane) {
      relations.push({
        id: `R${relationId++}`,
        from: household.id,
        to: nextBranch.id,
        type: "house",
        strength: 0.65,
        note: "同片家屋互助与共祭",
      });
    }

    if (index % 2 === 0 && acrossCluster) {
      relations.push({
        id: `R${relationId++}`,
        from: household.id,
        to: acrossCluster.id,
        type: "marriage",
        strength: 0.82,
        note: "通过婚姻形成的跨片联系",
      });
    }

    if (index % 5 === 0 && acrossCluster) {
      relations.push({
        id: `R${relationId++}`,
        from: household.id,
        to: acrossCluster.id,
        type: "matrilineal",
        strength: 0.7,
        note: "女儿婚后仍维持较强往来",
      });
    }

    if (index % 7 === 0 && nextBranch) {
      relations.push({
        id: `R${relationId++}`,
        from: household.id,
        to: nextBranch.id,
        type: "inheritance",
        strength: 0.88,
        note: "祖产与承屋权在分家后仍被追踪",
      });
    }

    if (index % 11 === 0 && branchMate) {
      relations.push({
        id: `R${relationId++}`,
        from: branchMate.id,
        to: household.id,
        type: "adoption",
        strength: 0.58,
        note: "出现过继或寄养线索",
      });
    }
  });

  const maternalData = buildMaternalData(households);
  return {
    project: {
      name: "云岭村家屋项目",
      location: "云岭村试验数据",
      summary: "一个用来整理村落家屋、父系谱系与母系女性网络的田野项目。",
    },
    households,
    relations,
    maternalData,
  };
}

function buildMaternalData(households) {
  const people = [];
  const relations = [];
  const motherNodes = [];
  let personIndex = 1;
  let relationIndex = 1;

  households.forEach((household, index) => {
    const mother = household.members.find((member) => member.id === household.motherId);
    const grandmother = household.members.find((member) => member.id === household.grandmotherId);
    const daughter = household.members.find((member) => household.daughterIds.includes(member.id)) ?? mother;
    const externalHouse = households[(index + 18) % households.length];
    const supportHouse = households[(index + 6) % households.length];
    const uncleHouse = households[(index + 9) % households.length];

    const elderNode = makePersonNode({
      label: `${grandmother.name}`,
      kind: "grandmother",
      sourceMember: grandmother,
      birthHouseId: household.id,
      residenceHouseId: household.id,
      focusLabel: "外婆线",
      x: 180 + (index % 6) * 230,
      y: 110 + Math.floor(index / 6) * 210,
    });
    const motherNode = makePersonNode({
      label: `${mother.name}`,
      kind: "mother",
      sourceMember: mother,
      birthHouseId: externalHouse.id,
      residenceHouseId: household.id,
      focusLabel: "婚入者",
      x: elderNode.x + 78,
      y: elderNode.y + 78,
    });
    const daughterNode = makePersonNode({
      label: `${daughter.name}`,
      kind: "daughter",
      sourceMember: daughter,
      birthHouseId: household.id,
      residenceHouseId: supportHouse.id,
      focusLabel: "婚出候选",
      x: motherNode.x + 78,
      y: motherNode.y + 82,
    });
    const sonNode = makePersonNode({
      label: `${household.shortName}子嗣`,
      kind: "child",
      sourceMember: household.members.find((member) => household.sonIds.includes(member.id)) ?? household.members[4],
      birthHouseId: household.id,
      residenceHouseId: household.id,
      focusLabel: "子女照护",
      x: motherNode.x - 98,
      y: motherNode.y + 84,
    });

    people.push(elderNode, motherNode, daughterNode, sonNode);
    motherNodes.push(motherNode);

    relations.push(
      {
        id: `M${relationIndex++}`,
        from: elderNode.id,
        to: motherNode.id,
        type: "motherChild",
        note: "外婆到母亲",
      },
      {
        id: `M${relationIndex++}`,
        from: motherNode.id,
        to: daughterNode.id,
        type: "motherChild",
        note: "母亲到女儿",
      },
      {
        id: `M${relationIndex++}`,
        from: motherNode.id,
        to: sonNode.id,
        type: "motherChild",
        note: "母亲到子女",
      },
      {
        id: `M${relationIndex++}`,
        from: motherNode.id,
        to: daughterNode.id,
        type: "marriageMove",
        note: `婚后流向 ${supportHouse.shortName}`,
      },
      {
        id: `M${relationIndex++}`,
        from: elderNode.id,
        to: sonNode.id,
        type: "uncleCare",
        note: `舅家来自 ${uncleHouse.shortName}`,
      }
    );

    relations.push({
      id: `M${relationIndex++}`,
      from: motherNode.id,
      to: elderNode.id,
      type: "support",
      note: `娘家支持来自 ${externalHouse.shortName}`,
    });

    function makePersonNode({ label, kind, sourceMember, birthHouseId, residenceHouseId, focusLabel, x, y }) {
      const node = {
        id: `MP${personIndex}`,
        name: label,
        kind,
        sourceMemberId: sourceMember.id,
        gender: sourceMember.gender,
        age: sourceMember.age,
        role: sourceMember.role,
        note: sourceMember.note,
        birthHouseId,
        residenceHouseId,
        focusLabel,
        x,
        y,
      };
      personIndex += 1;
      return node;
    }
  });

  motherNodes.forEach((motherNode, index) => {
    if (index % 2 === 0 && motherNodes[index + 1]) {
      relations.push({
        id: `M${relationIndex++}`,
        from: motherNode.id,
        to: motherNodes[index + 1].id,
        type: "sister",
        note: "姐妹之间持续走动",
      });
    }
  });

  return { people, relations };
}

const data = createVillageData();

const state = {
  mode: "house",
  selectedEntityId: data.households[0].id,
  activeLayers: new Set(viewModes[0].types),
  query: "",
  showNames: false,
  viewport: {
    scale: 1,
    x: 0,
    y: 0,
  },
  dragging: {
    active: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
  },
};

const CANVAS_VIEW = {
  width: 1320,
  height: 900,
};

const STORAGE_KEY = "kinmap-project-state-v1";

const dom = {
  statGrid: document.querySelector("#statGrid"),
  modeSwitch: document.querySelector("#modeSwitch"),
  layerFilters: document.querySelector("#layerFilters"),
  householdList: document.querySelector("#householdList"),
  householdCount: document.querySelector("#householdCount"),
  projectLocation: document.querySelector("#projectLocation"),
  projectScope: document.querySelector("#projectScope"),
  projectSummary: document.querySelector("#projectSummary"),
  entityListTitle: document.querySelector("#entityListTitle"),
  detailPane: document.querySelector("#detailPane"),
  relationPane: document.querySelector("#relationPane"),
  map: document.querySelector("#villageMap"),
  canvasFrame: document.querySelector(".canvas-frame"),
  legend: document.querySelector("#legend"),
  selectionStrip: document.querySelector("#selectionStrip"),
  canvasFocusCard: document.querySelector("#canvasFocusCard"),
  selectedBadge: document.querySelector("#selectedBadge"),
  viewTitle: document.querySelector("#viewTitle"),
  searchInput: document.querySelector("#searchInput"),
  fitViewBtn: document.querySelector("#fitViewBtn"),
  toggleNamesBtn: document.querySelector("#toggleNamesBtn"),
  exportJsonBtn: document.querySelector("#exportJsonBtn"),
  zoomInBtn: document.querySelector("#zoomInBtn"),
  zoomOutBtn: document.querySelector("#zoomOutBtn"),
  detailPanel: document.querySelector(".detail-panel"),
  openProjectBtn: document.querySelector("#openProjectBtn"),
  openEntryBtn: document.querySelector("#openEntryBtn"),
  openShareBtn: document.querySelector("#openShareBtn"),
  modalOverlay: document.querySelector("#modalOverlay"),
  closeModalBtn: document.querySelector("#closeModalBtn"),
  modalTitle: document.querySelector("#modalTitle"),
  modalTabs: document.querySelector("#modalTabs"),
  projectForm: document.querySelector("#projectForm"),
  projectNameInput: document.querySelector("#projectNameInput"),
  projectLocationInput: document.querySelector("#projectLocationInput"),
  projectSummaryInput: document.querySelector("#projectSummaryInput"),
  householdForm: document.querySelector("#householdForm"),
  personForm: document.querySelector("#personForm"),
  relationForm: document.querySelector("#relationForm"),
  personHouseholdSelect: document.querySelector("#personHouseholdSelect"),
  relationFromSelect: document.querySelector("#relationFromSelect"),
  relationToSelect: document.querySelector("#relationToSelect"),
  modalExportBtn: document.querySelector("#modalExportBtn"),
  copyShareLinkBtn: document.querySelector("#copyShareLinkBtn"),
  shareLinkOutput: document.querySelector("#shareLinkOutput"),
  importFileInput: document.querySelector("#importFileInput"),
  shareStatus: document.querySelector("#shareStatus"),
};

function getCurrentMode() {
  return viewModes.find((mode) => mode.id === state.mode);
}

function countAllPeople() {
  return data.households.reduce((total, household) => total + household.members.length, 0);
}

function updateProjectCard() {
  dom.projectLocation.textContent = data.project.location;
  dom.projectSummary.textContent = data.project.summary;
  dom.projectScope.textContent = `${data.households.length} 户 / ${countAllPeople()} 人`;
}

function refreshDerivedData() {
  data.maternalData = buildMaternalData(data.households);
}

function serializeAppState() {
  return {
    project: data.project,
    households: data.households,
    relations: data.relations,
  };
}

function applySerializedState(payload) {
  if (!payload || !Array.isArray(payload.households) || !Array.isArray(payload.relations) || !payload.project) {
    throw new Error("invalid payload");
  }
  data.project = payload.project;
  data.households = payload.households;
  data.relations = payload.relations;
  refreshDerivedData();
  state.selectedEntityId = getDefaultSelectionForMode(state.mode);
}

function saveToLocal() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeAppState()));
}

function loadFromLocal() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return false;
  applySerializedState(JSON.parse(raw));
  return true;
}

function encodeSharePayload(payload) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
}

function decodeSharePayload(value) {
  return JSON.parse(decodeURIComponent(escape(atob(value))));
}

function maybeLoadFromHash() {
  const hash = window.location.hash.replace(/^#share=/, "");
  if (!hash) return false;
  try {
    applySerializedState(decodeSharePayload(hash));
    return true;
  } catch (error) {
    console.warn("Failed to decode share payload", error);
    return false;
  }
}

function exportProjectJson() {
  const blob = new Blob([JSON.stringify(serializeAppState(), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "kinmap-project.json";
  link.click();
  URL.revokeObjectURL(url);
}

function getHouseholdById(id) {
  return data.households.find((household) => household.id === id);
}

function getNextHouseholdId() {
  const maxId = data.households.reduce((maxValue, household) => Math.max(maxValue, Number(household.id.replace("H", "")) || 0), 0);
  return `H${maxId + 1}`;
}

function getNextPersonId() {
  const maxId = data.households
    .flatMap((household) => household.members)
    .reduce((maxValue, member) => Math.max(maxValue, Number(member.id.replace("P", "")) || 0), 0);
  return `P${maxId + 1}`;
}

function getNextRelationId() {
  const maxId = data.relations.reduce((maxValue, relation) => Math.max(maxValue, Number(relation.id.replace("R", "")) || 0), 0);
  return `R${maxId + 1}`;
}

function reconcileHousehold(household) {
  household.memberCount = household.members.length;
  household.daughterIds = household.members
    .filter((member) => member.gender === "女" && (member.role.includes("子") || member.role.includes("继承")))
    .map((member) => member.id);
  household.sonIds = household.members
    .filter((member) => member.gender === "男" && (member.role.includes("子") || member.role.includes("继承")))
    .map((member) => member.id);
  household.motherId = household.members.find((member) => member.role.includes("配偶"))?.id ?? household.motherId ?? household.members[0]?.id;
  household.grandmotherId = household.members.find((member) => member.role.includes("祖"))?.id ?? household.grandmotherId ?? household.members[0]?.id;
  household.patriarchId = household.members.find((member) => member.role.includes("户主"))?.id ?? household.patriarchId ?? household.members[0]?.id;
}

function populateHouseholdSelects() {
  const options = data.households
    .slice()
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((household) => `<option value="${household.id}">${household.name}</option>`)
    .join("");
  dom.personHouseholdSelect.innerHTML = options;
  dom.relationFromSelect.innerHTML = options;
  dom.relationToSelect.innerHTML = options;
}

function syncProjectForm() {
  dom.projectNameInput.value = data.project.name;
  dom.projectLocationInput.value = data.project.location;
  dom.projectSummaryInput.value = data.project.summary;
}

function getMaternalPersonById(id) {
  return data.maternalData.people.find((person) => person.id === id);
}

function getCurrentEntities() {
  return state.mode === "matrilineal" ? data.maternalData.people : data.households;
}

function getCurrentEntity() {
  if (state.mode === "matrilineal") {
    return getMaternalPersonById(state.selectedEntityId) ?? data.maternalData.people[0];
  }
  return getHouseholdById(state.selectedEntityId) ?? data.households[0];
}

function getVisibleRelations() {
  const mode = getCurrentMode();
  if (state.mode === "matrilineal") {
    return data.maternalData.relations.filter(
      (relation) => mode.types.includes(relation.type) && state.activeLayers.has(relation.type)
    );
  }
  return data.relations.filter((relation) => mode.types.includes(relation.type) && state.activeLayers.has(relation.type));
}

function getFilteredEntities() {
  const query = state.query.trim().toLowerCase();
  const entities = getCurrentEntities();
  const sortedEntities =
    state.mode === "matrilineal"
      ? [...entities].sort((a, b) => {
          const rank = { mother: 0, daughter: 1, grandmother: 2, child: 3 };
          return (rank[a.kind] ?? 9) - (rank[b.kind] ?? 9) || a.name.localeCompare(b.name);
        })
      : entities;
  if (!query) return sortedEntities;

  if (state.mode === "matrilineal") {
    return sortedEntities.filter((person) =>
      [person.name, person.focusLabel, getHouseholdById(person.birthHouseId)?.shortName, getHouseholdById(person.residenceHouseId)?.shortName]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }

  return sortedEntities.filter((household) =>
    [household.name, household.branch, household.lane, household.pattern, household.region]
      .join(" ")
      .toLowerCase()
      .includes(query)
  );
}

function getSelectedRelations() {
  const selected = getCurrentEntity();
  if (state.mode === "matrilineal") {
    return getVisibleRelations().filter((relation) => relation.from === selected.id || relation.to === selected.id);
  }
  return getVisibleRelations().filter((relation) => relation.from === selected.id || relation.to === selected.id);
}

function getRenderableRelations(relations, selected, relatedIds) {
  if (state.mode === "patrilineal") {
    return relations.filter((relation) => {
      if (relation.type === "marriage") {
        return relation.from === selected.id || relation.to === selected.id;
      }
      return relatedIds.has(relation.from) && relatedIds.has(relation.to);
    });
  }
  return relations.filter((relation) => relation.from === selected.id || relation.to === selected.id);
}

function getRelationCountMap(relations) {
  const counts = new Map();
  relations.forEach((relation) => {
    counts.set(relation.from, (counts.get(relation.from) ?? 0) + 1);
    counts.set(relation.to, (counts.get(relation.to) ?? 0) + 1);
  });
  return counts;
}

function resetViewport() {
  const presets = {
    house: { scale: 1, x: 24, y: 24 },
    patrilineal: { scale: 1, x: 30, y: 30 },
    matrilineal: { scale: 1, x: 18, y: 18 },
  };
  state.viewport = { ...(presets[state.mode] ?? presets.house) };
}

function getDefaultSelectionForMode(modeId) {
  return modeId === "matrilineal"
    ? data.maternalData.people.find((person) => person.kind === "mother")?.id ?? data.maternalData.people[0].id
    : data.households[0].id;
}

function renderStats() {
  const visibleRelations = getVisibleRelations();
  const statItems =
    state.mode === "matrilineal"
      ? [
          { label: "女性节点", value: data.maternalData.people.filter((person) => person.gender === "女").length },
          { label: "母子线", value: data.maternalData.relations.filter((relation) => relation.type === "motherChild").length },
          { label: "婚入婚出", value: data.maternalData.relations.filter((relation) => relation.type === "marriageMove").length },
          { label: "外家支持", value: data.maternalData.relations.filter((relation) => relation.type === "support").length },
        ]
      : [
          { label: "可见关系", value: visibleRelations.length },
          { label: "关键家屋", value: data.households.filter((house) => house.keyHouse).length },
          { label: state.mode === "patrilineal" ? "父系分家" : "婚姻连线", value: data.relations.filter((relation) => relation.type === (state.mode === "patrilineal" ? "patrilineal" : "marriage")).length },
          { label: state.mode === "patrilineal" ? "承屋线" : "母系线索", value: data.relations.filter((relation) => relation.type === (state.mode === "patrilineal" ? "inheritance" : "matrilineal")).length },
        ];

  dom.statGrid.innerHTML = statItems
    .map(
      (item) => `
        <div class="stat-card">
          <span>${item.label}</span>
          <strong>${item.value}</strong>
        </div>
      `
    )
    .join("");

  dom.householdCount.textContent = `${getCurrentEntities().length} ${getCurrentMode().unitLabel}`;
}

function renderModeSwitch() {
  dom.modeSwitch.innerHTML = viewModes
    .map(
      (mode) => `
        <button class="segment-button ${mode.id === state.mode ? "active" : ""}" type="button" data-mode="${mode.id}">
          ${mode.label}
        </button>
      `
    )
    .join("");

  dom.modeSwitch.querySelectorAll("[data-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      state.mode = button.dataset.mode;
      state.activeLayers = new Set(getCurrentMode().types);
      state.selectedEntityId = getDefaultSelectionForMode(state.mode);
      resetViewport();
      render();
    });
  });
}

function renderLayerFilters() {
  dom.layerFilters.innerHTML = getCurrentMode().types
    .map((type) => {
      const meta = relationTypes[type];
      return `
        <button class="filter-chip ${state.activeLayers.has(type) ? "active" : ""}" type="button" data-layer="${type}">
          ${meta.label}
        </button>
      `;
    })
    .join("");

  dom.layerFilters.querySelectorAll("[data-layer]").forEach((button) => {
    button.addEventListener("click", () => {
      const layer = button.dataset.layer;
      if (state.activeLayers.has(layer)) {
        state.activeLayers.delete(layer);
      } else {
        state.activeLayers.add(layer);
      }
      render();
    });
  });
}

function renderLegend() {
  dom.legend.innerHTML = getCurrentMode().types
    .map((type) => {
      const meta = relationTypes[type];
      return `
        <span class="legend-item">
          <span class="legend-swatch" style="background:${meta.color};"></span>
          ${meta.label}
        </span>
      `;
    })
    .join("");
}

function renderEntityList() {
  const items = getFilteredEntities();
  const selected = getCurrentEntity();

  dom.householdList.innerHTML = items
    .map((item) => {
      const isActive = item.id === selected.id;
      if (state.mode === "matrilineal") {
        const birthHouse = getHouseholdById(item.birthHouseId);
        const residenceHouse = getHouseholdById(item.residenceHouseId);
        return `
          <button class="household-item ${isActive ? "active" : ""}" type="button" data-id="${item.id}">
            <strong>${item.name}</strong>
            <span class="list-meta">${item.focusLabel} · ${item.age} 岁 · ${item.role}</span>
            <span class="list-meta">生于 ${birthHouse?.shortName ?? "-"} · 居于 ${residenceHouse?.shortName ?? "-"}</span>
            ${isActive ? `<span class="list-meta">${item.note}</span>` : ""}
          </button>
        `;
      }

      return `
        <button class="household-item ${isActive ? "active" : ""}" type="button" data-id="${item.id}">
          <strong>${item.name}</strong>
          <span class="list-meta">${item.lane} · ${item.branch} · ${item.memberCount} 人</span>
          <span class="list-meta">${state.mode === "patrilineal" ? `第 ${item.generation} 代 · ${item.pattern}` : `${item.pattern} · ${item.region}`}</span>
          ${
            isActive
              ? `<span class="list-meta">${item.members
                  .slice(0, 4)
                  .map((member) => member.name)
                  .join(" · ")}</span>`
              : ""
          }
        </button>
      `;
    })
    .join("");

  if (!items.length) {
    dom.householdList.innerHTML = `<div class="empty-state">没有匹配到结果。可以试试房支、地片、女性节点或家屋代号。</div>`;
  }

  dom.householdList.querySelectorAll("[data-id]").forEach((button) => {
    button.addEventListener("click", () => {
      selectEntity(button.dataset.id, { centerMap: true, revealDetails: true });
    });
  });
}

function renderDetailPane() {
  const selected = getCurrentEntity();

  if (state.mode === "matrilineal") {
    const birthHouse = getHouseholdById(selected.birthHouseId);
    const residenceHouse = getHouseholdById(selected.residenceHouseId);
    const selectedRelations = getSelectedRelations();
    dom.selectedBadge.textContent = selected.name;
    dom.detailPane.innerHTML = `
      <div class="detail-hero">
        <h3 class="detail-title">${selected.name}</h3>
        <p class="detail-subtitle">${selected.focusLabel} · ${selected.age} 岁 · ${selected.role}</p>
        <p class="detail-copy">${selected.note}</p>
      </div>
      <div class="tag-row">
        <span class="tag">出生户 ${birthHouse?.shortName ?? "-"}</span>
        <span class="tag">居住户 ${residenceHouse?.shortName ?? "-"}</span>
        <span class="tag">${selectedRelations.length} 条母系关系</span>
      </div>
      <div>
        <span class="meta-label">母系视角</span>
        <div class="member-grid">
          <article class="member-card">
            <h4 class="member-name">外家与婚居</h4>
            <p>这一节点把人物从出生户带到当前居住户，重点看婚入、婚出与持续往来。</p>
          </article>
          <article class="member-card">
            <h4 class="member-name">子女与照护</h4>
            <p>右侧关系列表会区分母子线、舅甥照护和娘家支持，方便追踪女性维系的网络。</p>
          </article>
        </div>
      </div>
    `;
    return;
  }

  const keyMembers = selected.members.slice(0, 6);
  const patrilineLine = buildPatrilineLine(selected);
  dom.selectedBadge.textContent = selected.shortName;

  dom.detailPane.innerHTML = `
    <div class="detail-hero">
      <h3 class="detail-title">${selected.name}</h3>
      <p class="detail-subtitle">${selected.lane} · ${selected.branch} · ${selected.pattern}</p>
      <p class="detail-copy">${selected.notes}</p>
    </div>

    <div class="tag-row">
      ${selected.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}
      <span class="tag">${selected.memberCount} 位成员</span>
      ${selected.keyHouse ? `<span class="tag">关键家屋</span>` : ""}
      ${state.mode === "patrilineal" ? `<span class="tag">第 ${selected.generation} 代</span>` : ""}
    </div>

    ${
      state.mode === "patrilineal"
        ? `
          <div>
            <span class="meta-label">父系链</span>
            <div class="member-grid">
              ${patrilineLine
                .map(
                  (household) => `
                    <article class="member-card">
                      <h4 class="member-name">${household.shortName}</h4>
                      <span class="member-meta">${household.branch} · 第 ${household.generation} 代</span>
                      <p>${household.keyHouse ? "祖屋或关键承屋点" : "沿父系分家线继续展开"}</p>
                    </article>
                  `
                )
                .join("")}
            </div>
          </div>
        `
        : ""
    }

    <div>
      <span class="meta-label">${state.mode === "patrilineal" ? "父系成员" : "核心成员"}</span>
      <div class="member-grid">
        ${keyMembers
          .map(
            (member) => `
              <article class="member-card">
                <h4 class="member-name">${member.name}</h4>
                <span class="member-meta">${member.gender} · ${member.age} 岁 · ${member.role}</span>
                <p>${member.note}</p>
              </article>
            `
          )
          .join("")}
      </div>
    </div>
  `;
}

function renderRelationPane() {
  const selectedRelations = getSelectedRelations();
  const selected = getCurrentEntity();

  dom.relationPane.innerHTML = selectedRelations.length
    ? selectedRelations
        .slice(0, 8)
        .map((relation) => {
          const otherId = relation.from === selected.id ? relation.to : relation.from;
          const other = state.mode === "matrilineal" ? getMaternalPersonById(otherId) : getHouseholdById(otherId);
          return `
            <button class="relation-item" type="button" data-id="${otherId}">
              <strong>${relationTypes[relation.type].label}</strong>
              <span class="relation-type">${other?.name ?? other?.shortName ?? otherId}</span>
              <span class="list-meta">${relation.note}</span>
            </button>
          `;
        })
        .join("")
    : `<div class="empty-state">当前图层下，这个节点没有显示出来的关系。</div>`;

  dom.relationPane.querySelectorAll("[data-id]").forEach((button) => {
    button.addEventListener("click", () => {
      selectEntity(button.dataset.id, { centerMap: true, revealDetails: true });
    });
  });
}

function buildPatrilineLine(household) {
  const line = [];
  let current = household;
  while (current) {
    line.unshift(current);
    current = current.patrilineOriginId ? getHouseholdById(current.patrilineOriginId) : null;
  }
  return line;
}

function buildHouseMapModel() {
  const laneOrder = new Map(laneNames.map((lane, index) => [lane, index]));
  const grouped = new Map(laneNames.map((lane) => [lane, []]));
  getFilteredEntities()
    .slice()
    .sort((a, b) => a.id.localeCompare(b.id))
    .forEach((household) => {
      grouped.get(household.lane)?.push(household);
    });

  const entities = [];
  laneNames.forEach((lane, laneIndex) => {
    (grouped.get(lane) ?? []).forEach((household, index) => {
      const col = index % 6;
      const row = Math.floor(index / 6);
      entities.push({
        ...household,
        x: 110 + col * 255,
        y: 120 + laneIndex * 360 + row * 175,
      });
    });
  });
  const entityIds = new Set(entities.map((entity) => entity.id));
  const relations = getVisibleRelations().filter((relation) => entityIds.has(relation.from) && entityIds.has(relation.to));
  return {
    entities,
    relations,
    bounds: { width: 1760, height: 1240 },
    backgroundMarkup: laneNames
      .map((lane, laneIndex) => {
        const y = 72 + laneIndex * 360;
        return `
          <g>
            <rect x="60" y="${y}" width="1620" height="300" rx="28" fill="rgba(255,255,255,0.22)" stroke="rgba(105,87,67,0.1)" />
            <text x="92" y="${y + 42}" class="node-title" style="font-size:24px;">${lane}</text>
          </g>
        `;
      })
      .join(""),
  };
}

function buildPatrilinealMapModel() {
  const bucketed = new Map();
  getFilteredEntities().forEach((household) => {
    const key = `${household.branch}-${household.generation}`;
    const list = bucketed.get(key) ?? [];
    list.push(household);
    bucketed.set(key, list);
  });

  const entities = [];
  branchNames.forEach((branch, branchIndex) => {
    const branchEntities = getFilteredEntities()
      .filter((household) => household.branch === branch)
      .sort((a, b) => a.generation - b.generation || a.lane.localeCompare(b.lane) || a.id.localeCompare(b.id));

    branchEntities.forEach((household) => {
      const bucket = bucketed.get(`${household.branch}-${household.generation}`) ?? [household];
      const slotIndex = bucket.findIndex((candidate) => candidate.id === household.id);
      const slotCol = slotIndex % 2;
      const slotRow = Math.floor(slotIndex / 2);
      entities.push({
        ...household,
        x: 110 + branchIndex * 760 + slotCol * 260,
        y: 150 + (household.generation - 1) * 235 + slotRow * 150,
      });
    });
  });
  const entityIds = new Set(entities.map((entity) => entity.id));
  const relations = getVisibleRelations().filter((relation) => entityIds.has(relation.from) && entityIds.has(relation.to));
  return {
    entities,
    relations,
    bounds: { width: 3250, height: 1740 },
    backgroundMarkup: branchNames
      .map((branch, branchIndex) => {
        const x = 70 + branchIndex * 760;
        return `
          <g>
            <rect x="${x}" y="54" width="640" height="1540" rx="30" fill="rgba(255,255,255,0.18)" stroke="rgba(105,87,67,0.1)" />
            <text x="${x + 26}" y="100" class="node-title" style="font-size:26px;">${branch}</text>
          </g>
        `;
      })
      .join("") +
      Array.from({ length: 6 }, (_, index) => {
        const y = 126 + index * 235;
        return `<text x="24" y="${y + 30}" class="node-meta" style="font-size:18px;">第 ${index + 1} 代</text>`;
      }).join(""),
  };
}

function buildMatrilinealMapModel() {
  const householdGroups = new Map();
  getFilteredEntities().forEach((person) => {
    const key = person.residenceHouseId;
    const list = householdGroups.get(key) ?? [];
    list.push(person);
    householdGroups.set(key, list);
  });

  const sortedHouseholdIds = Array.from(householdGroups.keys()).sort((a, b) => a.localeCompare(b));
  const offsets = {
    grandmother: { x: 20, y: 24 },
    mother: { x: 156, y: 42 },
    daughter: { x: 168, y: 146 },
    child: { x: 28, y: 156 },
  };

  const entities = [];
  sortedHouseholdIds.forEach((householdId, index) => {
    const col = index % 4;
    const row = Math.floor(index / 4);
    const baseX = 110 + col * 410;
    const baseY = 110 + row * 280;
    const people = (householdGroups.get(householdId) ?? []).sort((a, b) => {
      const rank = { mother: 0, daughter: 1, grandmother: 2, child: 3 };
      return (rank[a.kind] ?? 9) - (rank[b.kind] ?? 9) || a.name.localeCompare(b.name);
    });

    people.forEach((person) => {
      const offset = offsets[person.kind] ?? { x: 0, y: 0 };
      entities.push({
        ...person,
        x: baseX + offset.x,
        y: baseY + offset.y,
        clusterX: baseX,
        clusterY: baseY,
      });
    });
  });
  const entityIds = new Set(entities.map((entity) => entity.id));
  const relations = getVisibleRelations().filter((relation) => entityIds.has(relation.from) && entityIds.has(relation.to));
  return {
    entities,
    relations,
    bounds: {
      width: 1800,
      height: Math.max(1280, 150 + Math.ceil(sortedHouseholdIds.length / 4) * 280),
    },
    backgroundMarkup: sortedHouseholdIds
      .map((householdId, index) => {
        const col = index % 4;
        const row = Math.floor(index / 4);
        const x = 90 + col * 410;
        const y = 90 + row * 280;
        const household = getHouseholdById(householdId);
        return `
          <g>
            <rect x="${x}" y="${y}" width="340" height="230" rx="26" fill="rgba(255,255,255,0.18)" stroke="rgba(105,87,67,0.1)" />
            <text x="${x + 18}" y="${y + 34}" class="node-meta" style="font-size:16px;">居住组 ${household?.shortName ?? householdId}</text>
          </g>
        `;
      })
      .join(""),
  };
}

function buildMapModel() {
  if (state.mode === "patrilineal") return buildPatrilinealMapModel();
  if (state.mode === "matrilineal") return buildMatrilinealMapModel();
  return buildHouseMapModel();
}

function buildGridMarkup(bounds) {
  const lines = [];
  for (let x = 0; x <= bounds.width; x += 120) {
    lines.push(`<line x1="${x}" y1="0" x2="${x}" y2="${bounds.height}" class="canvas-grid-line ${x % 240 === 0 ? "major" : ""}" />`);
  }
  for (let y = 0; y <= bounds.height; y += 120) {
    lines.push(`<line x1="0" y1="${y}" x2="${bounds.width}" y2="${y}" class="canvas-grid-line ${y % 240 === 0 ? "major" : ""}" />`);
  }
  return lines.join("");
}

function renderMap() {
  const selected = getCurrentEntity();
  const { entities, relations, bounds, backgroundMarkup = "" } = buildMapModel();
  const relationCounts = getRelationCountMap(relations);
  const selectedNeighborIds =
    state.mode === "patrilineal"
      ? new Set(buildPatrilineLine(selected).map((household) => household.id))
      : new Set(
          relations
            .filter((relation) => relation.from === selected.id || relation.to === selected.id)
            .flatMap((relation) => [relation.from, relation.to])
        );
  selectedNeighborIds.add(selected.id);
  const renderableRelations = getRenderableRelations(relations, selected, selectedNeighborIds);

  const edgeMarkup = renderableRelations
    .map((relation) => {
      const from = entities.find((entity) => entity.id === relation.from);
      const to = entities.find((entity) => entity.id === relation.to);
      const meta = relationTypes[relation.type];
      const start = getNodeAnchor(from);
      const end = getNodeAnchor(to);
      const deltaX = end.x - start.x;
      const curveX = start.x + deltaX / 2;
      const curveY = start.y < end.y ? Math.min(start.y, end.y) - 24 : start.y + 18;
      const isActive =
        state.mode === "patrilineal"
          ? selectedNeighborIds.has(relation.from) && selectedNeighborIds.has(relation.to)
          : relation.from === selected.id || relation.to === selected.id;
      const edgeClass = isActive ? "edge active" : selectedNeighborIds.size > 1 ? "edge recessed" : "edge related";

      return `
        <g>
          <path class="${edgeClass}" d="M ${start.x} ${start.y} Q ${curveX} ${curveY} ${end.x} ${end.y}" style="stroke:${meta.color};stroke-dasharray:${meta.dash};" />
          <circle class="edge-dot" cx="${start.x}" cy="${start.y}" r="4.5" fill="${meta.color}" />
          <circle class="edge-dot" cx="${end.x}" cy="${end.y}" r="4.5" fill="${meta.color}" />
          ${isActive ? `<text class="edge-label" x="${curveX}" y="${curveY - 8}" text-anchor="middle">${meta.label}</text>` : ""}
        </g>
      `;
    })
    .join("");

  const laneMarkup = state.mode === "patrilineal" ? renderPatrilinealLanes() : "";

  const nodeMarkup = entities
    .map((entity) => {
      const isSelected = entity.id === selected.id;
      const isRelated = selectedNeighborIds.has(entity.id) && !isSelected;
      const relationCount = relationCounts.get(entity.id) ?? 0;
      return state.mode === "matrilineal"
        ? renderMatrilinealNode(entity, isSelected, isRelated, relationCount)
        : renderHouseholdNode(entity, isSelected, isRelated, relationCount);
    })
    .join("");

  dom.map.innerHTML = `
    <g id="mapViewport" transform="translate(${state.viewport.x} ${state.viewport.y}) scale(${state.viewport.scale})">
      ${buildGridMarkup(bounds)}
      ${laneMarkup}
      ${backgroundMarkup}
      ${edgeMarkup}
      ${nodeMarkup}
    </g>
  `;
  dom.map.setAttribute("viewBox", `0 0 ${CANVAS_VIEW.width} ${CANVAS_VIEW.height}`);

  dom.map.querySelectorAll("[data-node-id]").forEach((node) => {
    node.addEventListener("click", () => {
      selectEntity(node.dataset.nodeId, { revealDetails: false, centerMap: false });
    });
  });
}

function renderPatrilinealLanes() {
  return "";
}

function renderHouseholdNode(entity, isSelected, isRelated, relationCount) {
  const accent = isSelected ? relationTypes.inheritance.color : state.mode === "patrilineal" ? relationTypes.patrilineal.color : relationTypes.house.color;
  const previewText =
    state.mode === "patrilineal"
      ? `第 ${entity.generation} 代 · ${entity.keyHouse ? "祖屋/承屋点" : entity.pattern}`
      : `${entity.memberCount} 位成员 · 点击查看`;

  return `
    <g class="village-node ${isSelected ? "selected" : ""} ${isRelated ? "related" : ""}" data-node-id="${entity.id}" transform="translate(${entity.x}, ${entity.y})">
      <rect class="node-hitbox" x="0" y="0" width="220" height="128" rx="22" />
      <rect class="main" x="0" y="0" width="220" height="128" rx="22" />
      <rect class="node-accent" x="0" y="0" width="220" height="12" rx="22" style="fill:${accent};" />
      <text class="node-title" x="18" y="38">${entity.shortName}</text>
      <text class="node-meta" x="18" y="62">${entity.branch} · ${entity.lane}</text>
      <text class="node-relation-count" x="202" y="26" text-anchor="end">${relationCount} 条联系</text>
      <text class="node-mini" x="18" y="96">${previewText}</text>
      ${
        state.showNames || isSelected
          ? entity.members
              .slice(0, 2)
              .map((member, index) => `<text class="node-mini" x="18" y="${96 + index * 18}">${member.name}</text>`)
              .join("")
          : ""
      }
    </g>
  `;
}

function renderMatrilinealNode(entity, isSelected, isRelated, relationCount) {
  const accentByKind = {
    grandmother: "#8b5e3c",
    mother: "#b14d45",
    daughter: "#d97706",
    child: "#4338ca",
  };
  const birthHouse = getHouseholdById(entity.birthHouseId);
  const residenceHouse = getHouseholdById(entity.residenceHouseId);
  return `
    <g class="village-node ${isSelected ? "selected" : ""} ${isRelated ? "related" : ""}" data-node-id="${entity.id}" transform="translate(${entity.x}, ${entity.y})">
      <rect class="node-hitbox" x="0" y="0" width="200" height="116" rx="50" />
      <rect class="main" x="0" y="0" width="200" height="116" rx="50" />
      <rect class="node-accent" x="12" y="12" width="176" height="10" rx="999" style="fill:${accentByKind[entity.kind] ?? relationTypes.matrilineal.color};" />
      <text class="node-title" x="18" y="42" style="font-size:24px;">${entity.name}</text>
      <text class="node-meta" x="18" y="64">${entity.focusLabel} · ${entity.age} 岁</text>
      <text class="node-mini" x="18" y="88">生于 ${birthHouse?.shortName ?? "-"} · 居于 ${residenceHouse?.shortName ?? "-"}</text>
      <text class="node-relation-count" x="182" y="36" text-anchor="end">${relationCount} 条线</text>
    </g>
  `;
}

function getNodeAnchor(entity) {
  if (state.mode === "matrilineal") {
    return { x: entity.x + 100, y: entity.y + 58 };
  }
  return { x: entity.x + 110, y: entity.y + 44 };
}

function renderSelectionStrip() {
  const selected = getCurrentEntity();
  const related = getSelectedRelations()
    .slice(0, 4)
    .map((relation) => {
      const otherId = relation.from === selected.id ? relation.to : relation.from;
      const other = state.mode === "matrilineal" ? getMaternalPersonById(otherId) : getHouseholdById(otherId);
      return `
        <button class="selection-card" type="button" data-id="${otherId}">
          <strong>${other?.name ?? other?.shortName ?? otherId}</strong>
          <span>${relationTypes[relation.type].label}</span>
          <span>${relation.note}</span>
        </button>
      `;
    })
    .join("");

  const summary =
    state.mode === "matrilineal"
      ? `生于 ${getHouseholdById(selected.birthHouseId)?.shortName ?? "-"} · 居于 ${getHouseholdById(selected.residenceHouseId)?.shortName ?? "-"}`
      : `${selected.memberCount} 人 · ${selected.branch} · ${selected.lane}`;

  dom.selectionStrip.innerHTML = `
    <div class="selection-card">
      <strong>${selected.name ?? selected.shortName}</strong>
      <span>${summary}</span>
      <span>${getCurrentMode().focus}</span>
    </div>
    ${related || `<div class="selection-card"><strong>当前没有可见关系</strong><span>可以切换图层或换一个节点继续看。</span></div>`}
  `;

  dom.selectionStrip.querySelectorAll("[data-id]").forEach((button) => {
    button.addEventListener("click", () => {
      selectEntity(button.dataset.id, { centerMap: true, revealDetails: true });
    });
  });
}

function renderCanvasFocusCard() {
  const selected = getCurrentEntity();
  const relationCount = getSelectedRelations().length;

  if (state.mode === "matrilineal") {
    const birthHouse = getHouseholdById(selected.birthHouseId);
    const residenceHouse = getHouseholdById(selected.residenceHouseId);
    dom.canvasFocusCard.innerHTML = `
      <strong>${selected.name}</strong>
      <span>${selected.focusLabel} · ${selected.age} 岁 · ${selected.role}</span>
      <span>生于 ${birthHouse?.shortName ?? "-"} · 居于 ${residenceHouse?.shortName ?? "-"}</span>
      <span>当前画布显示与她直接相关的 ${relationCount} 条母系关系</span>
    `;
    return;
  }

  dom.canvasFocusCard.innerHTML = `
    <strong>${selected.name}</strong>
    <span>${selected.branch} · ${selected.lane} · ${selected.memberCount} 位成员</span>
    <span>${state.mode === "patrilineal" ? `第 ${selected.generation} 代 · 父系链已高亮` : selected.pattern}</span>
    <span>当前画布显示与这一户直接相关的 ${relationCount} 条关系</span>
  `;
}

function clampScale(scale) {
  return Math.max(0.55, Math.min(2.4, scale));
}

function zoomAtPoint(nextScale, clientX, clientY) {
  const rect = dom.map.getBoundingClientRect();
  const pointX = clientX - rect.left;
  const pointY = clientY - rect.top;
  const previousScale = state.viewport.scale;
  const scale = clampScale(nextScale);
  const worldX = (pointX - state.viewport.x) / previousScale;
  const worldY = (pointY - state.viewport.y) / previousScale;
  state.viewport.scale = scale;
  state.viewport.x = pointX - worldX * scale;
  state.viewport.y = pointY - worldY * scale;
  renderMap();
}

function centerOnEntity(entityId) {
  const entity = getCurrentEntities().find((item) => item.id === entityId);
  if (!entity) return;
  const rect = dom.map.getBoundingClientRect();
  const anchor = getNodeAnchor(entity);
  state.viewport.x = rect.width / 2 - anchor.x * state.viewport.scale;
  state.viewport.y = rect.height / 2 - anchor.y * state.viewport.scale;
}

function revealDetailPanel() {
  dom.detailPanel.classList.add("flash");
  dom.detailPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  window.setTimeout(() => {
    dom.detailPanel.classList.remove("flash");
  }, 900);
}

function selectEntity(entityId, options = {}) {
  const { centerMap = false, revealDetails = false } = options;
  state.selectedEntityId = entityId;
  if (centerMap) {
    centerOnEntity(entityId);
  }
  render();
  if (revealDetails) {
    revealDetailPanel();
  }
}

function openModal(tabName) {
  dom.modalOverlay.classList.remove("hidden");
  setActiveModalTab(tabName);
}

function closeModal() {
  dom.modalOverlay.classList.add("hidden");
}

function setActiveModalTab(tabName) {
  const titles = {
    project: "项目与录入",
    entry: "资料录入",
    share: "分享与迁移",
  };
  dom.modalTitle.textContent = titles[tabName] ?? titles.project;
  dom.modalTabs.querySelectorAll("[data-modal-tab]").forEach((button) => {
    button.classList.toggle("active", button.dataset.modalTab === tabName);
  });
  document.querySelectorAll("[data-modal-panel]").forEach((panel) => {
    panel.classList.toggle("hidden", panel.dataset.modalPanel !== tabName);
  });
}

function persistAndRender(statusMessage) {
  refreshDerivedData();
  saveToLocal();
  updateProjectCard();
  syncProjectForm();
  populateHouseholdSelects();
  render();
  if (statusMessage) {
    dom.shareStatus.textContent = statusMessage;
  }
}

function handleProjectSubmit(event) {
  event.preventDefault();
  data.project.name = dom.projectNameInput.value.trim() || data.project.name;
  data.project.location = dom.projectLocationInput.value.trim() || data.project.location;
  data.project.summary = dom.projectSummaryInput.value.trim() || data.project.summary;
  persistAndRender("项目已保存到本地。");
  closeModal();
}

function handleHouseholdSubmit(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const householdId = getNextHouseholdId();
  const name = form.get("household_name").toString().trim();
  const lane = form.get("lane").toString();
  const branch = form.get("branch").toString();
  const pattern = form.get("pattern").toString();
  const region = form.get("region").toString().trim() || "待补充";
  const notes = form.get("notes").toString().trim() || "新录入家屋，待补充田野说明。";
  const branchPeers = data.households.filter((household) => household.branch === branch && household.lane === lane);
  const generation = Math.max(1, branchPeers.reduce((maxValue, household) => Math.max(maxValue, household.generation || 1), 0) + 1);
  const shortName = name.replace("家屋 ", "");

  const household = {
    id: householdId,
    name,
    shortName,
    lane,
    branch,
    pattern,
    region,
    notes,
    memberCount: 0,
    x: 0,
    y: 0,
    members: [],
    tags: [branch, lane, pattern],
    keyHouse: false,
    generation,
    branchIndex: branchNames.indexOf(branch),
    cluster: laneNames.indexOf(lane),
    patrilineOriginId: null,
    patriarchId: null,
    grandmotherId: null,
    motherId: null,
    daughterIds: [],
    sonIds: [],
  };

  data.households.push(household);
  event.currentTarget.reset();
  state.selectedEntityId = household.id;
  persistAndRender(`已新增 ${household.name}。`);
}

function handlePersonSubmit(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const household = getHouseholdById(form.get("household_id").toString());
  if (!household) return;
  const person = {
    id: getNextPersonId(),
    householdId: household.id,
    residenceHouseId: household.id,
    name: form.get("person_name").toString().trim(),
    gender: form.get("gender").toString(),
    age: Number(form.get("age")) || 0,
    role: form.get("role").toString().trim() || "成员",
    note: form.get("note").toString().trim() || "新录入成员。",
  };
  household.members.push(person);
  reconcileHousehold(household);
  event.currentTarget.reset();
  dom.personHouseholdSelect.value = household.id;
  state.selectedEntityId = state.mode === "matrilineal" ? getDefaultSelectionForMode("matrilineal") : household.id;
  persistAndRender(`已把 ${person.name} 加入 ${household.name}。`);
}

function handleRelationSubmit(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const fromId = form.get("from_id").toString();
  const toId = form.get("to_id").toString();
  if (!fromId || !toId || fromId === toId) {
    dom.shareStatus.textContent = "关系的起点和终点需要是两个不同家屋。";
    return;
  }
  const relationType = form.get("relation_type").toString();
  const relation = {
    id: getNextRelationId(),
    from: fromId,
    to: toId,
    type: relationType,
    strength: 0.8,
    note: form.get("relation_note").toString().trim() || "新录入关系。",
  };
  data.relations.push(relation);
  if (relationType === "patrilineal") {
    const toHousehold = getHouseholdById(toId);
    const fromHousehold = getHouseholdById(fromId);
    if (toHousehold && fromHousehold) {
      toHousehold.patrilineOriginId = fromId;
      toHousehold.generation = Math.max(toHousehold.generation || 1, (fromHousehold.generation || 1) + 1);
    }
  }
  event.currentTarget.reset();
  persistAndRender("已新增家屋关系。");
}

async function handleCopyShareLink() {
  const payload = encodeSharePayload(serializeAppState());
  const url = `${window.location.origin}${window.location.pathname}#share=${payload}`;
  dom.shareLinkOutput.value = url;
  await navigator.clipboard.writeText(url);
  dom.shareStatus.textContent = "只读链接已复制到剪贴板。";
}

function handleImportFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      applySerializedState(JSON.parse(String(reader.result)));
      persistAndRender("项目文件已导入。");
      closeModal();
    } catch (error) {
      dom.shareStatus.textContent = "导入失败，文件格式不正确。";
    }
  };
  reader.readAsText(file);
}

function bindCanvasInteractions() {
  dom.map.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      const delta = event.deltaY < 0 ? 1.12 : 0.9;
      zoomAtPoint(state.viewport.scale * delta, event.clientX, event.clientY);
    },
    { passive: false }
  );

  dom.map.addEventListener("pointerdown", (event) => {
    if (event.target.closest("[data-node-id]")) return;
    state.dragging = {
      active: true,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: state.viewport.x,
      originY: state.viewport.y,
    };
    dom.canvasFrame.classList.add("dragging");
    dom.map.setPointerCapture(event.pointerId);
  });

  dom.map.addEventListener("pointermove", (event) => {
    if (!state.dragging.active || state.dragging.pointerId !== event.pointerId) return;
    state.viewport.x = state.dragging.originX + (event.clientX - state.dragging.startX);
    state.viewport.y = state.dragging.originY + (event.clientY - state.dragging.startY);
    renderMap();
  });

  function endDrag(event) {
    if (!state.dragging.active || state.dragging.pointerId !== event.pointerId) return;
    state.dragging.active = false;
    state.dragging.pointerId = null;
    dom.canvasFrame.classList.remove("dragging");
    dom.map.releasePointerCapture(event.pointerId);
  }

  dom.map.addEventListener("pointerup", endDrag);
  dom.map.addEventListener("pointercancel", endDrag);
}

function bindControls() {
  dom.openProjectBtn.addEventListener("click", () => openModal("project"));
  dom.openEntryBtn.addEventListener("click", () => openModal("entry"));
  dom.openShareBtn.addEventListener("click", () => openModal("share"));
  dom.closeModalBtn.addEventListener("click", closeModal);
  dom.modalOverlay.addEventListener("click", (event) => {
    if (event.target === dom.modalOverlay) {
      closeModal();
    }
  });
  dom.modalTabs.querySelectorAll("[data-modal-tab]").forEach((button) => {
    button.addEventListener("click", () => setActiveModalTab(button.dataset.modalTab));
  });
  dom.projectForm.addEventListener("submit", handleProjectSubmit);
  dom.householdForm.addEventListener("submit", handleHouseholdSubmit);
  dom.personForm.addEventListener("submit", handlePersonSubmit);
  dom.relationForm.addEventListener("submit", handleRelationSubmit);
  dom.importFileInput.addEventListener("change", handleImportFile);

  dom.searchInput.addEventListener("input", (event) => {
    state.query = event.target.value;
    render();
  });

  dom.fitViewBtn.addEventListener("click", () => {
    state.query = "";
    dom.searchInput.value = "";
    resetViewport();
    render();
  });

  dom.toggleNamesBtn.addEventListener("click", () => {
    state.showNames = !state.showNames;
    renderMap();
  });

  dom.exportJsonBtn.addEventListener("click", () => {
    exportProjectJson();
  });
  dom.modalExportBtn.addEventListener("click", exportProjectJson);
  dom.copyShareLinkBtn.addEventListener("click", () => {
    handleCopyShareLink().catch(() => {
      dom.shareStatus.textContent = "复制链接失败，浏览器可能禁止了剪贴板。";
    });
  });

  dom.zoomInBtn.addEventListener("click", () => {
    const rect = dom.map.getBoundingClientRect();
    zoomAtPoint(state.viewport.scale * 1.15, rect.left + rect.width / 2, rect.top + rect.height / 2);
  });

  dom.zoomOutBtn.addEventListener("click", () => {
    const rect = dom.map.getBoundingClientRect();
    zoomAtPoint(state.viewport.scale * 0.87, rect.left + rect.width / 2, rect.top + rect.height / 2);
  });
}

function render() {
  dom.viewTitle.textContent = getCurrentMode().title;
  dom.entityListTitle.textContent = getCurrentMode().listLabel;
  updateProjectCard();
  renderStats();
  renderModeSwitch();
  renderLayerFilters();
  renderLegend();
  populateHouseholdSelects();
  renderEntityList();
  renderDetailPane();
  renderRelationPane();
  renderMap();
  renderSelectionStrip();
  renderCanvasFocusCard();
}

maybeLoadFromHash() || loadFromLocal();
bindControls();
bindCanvasInteractions();
resetViewport();
syncProjectForm();
render();
