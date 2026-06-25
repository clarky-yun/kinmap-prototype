const viewModes = [
  {
    id: "house",
    label: "非单系 / 家屋制",
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

function createDefaultAreas() {
  return [
    { id: "A1", name: "上寨", x: 60, y: 72, width: 1620, height: 300, color: "#d7b46a" },
    { id: "A2", name: "中寨", x: 60, y: 432, width: 1620, height: 300, color: "#9fb36a" },
    { id: "A3", name: "下寨", x: 60, y: 792, width: 1620, height: 300, color: "#7aa7a0" },
  ];
}

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
        status: role === "配偶" ? "婚入" : "在户",
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
    areas: createDefaultAreas(),
    maternalPositions: {},
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
  suppressNextNodeClick: false,
  selectedAreaId: data.areas[0]?.id ?? null,
  selectedRelationId: null,
  historyPast: [],
  historyFuture: [],
  pendingHistory: null,
  viewport: {
    scale: 1,
    x: 0,
    y: 0,
  },
  dragging: {
    active: false,
    type: null,
    pointerId: null,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
    targetId: null,
    moved: false,
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
  undoBtn: document.querySelector("#undoBtn"),
  redoBtn: document.querySelector("#redoBtn"),
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
  areaForm: document.querySelector("#areaForm"),
  areaControlList: document.querySelector("#areaControlList"),
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
  if (!Array.isArray(data.areas)) {
    data.areas = createDefaultAreas();
  }
  if (!data.maternalPositions || typeof data.maternalPositions !== "object") {
    data.maternalPositions = {};
  }
  data.households.forEach(reconcileHousehold);
  data.maternalData = buildMaternalData(data.households);
}

function serializeAppState() {
  return {
    project: data.project,
    households: data.households,
    relations: data.relations,
    areas: data.areas,
    maternalPositions: data.maternalPositions ?? {},
  };
}

function applySerializedState(payload) {
  if (!payload || !Array.isArray(payload.households) || !Array.isArray(payload.relations) || !payload.project) {
    throw new Error("invalid payload");
  }
  data.project = payload.project;
  data.households = payload.households;
  data.relations = payload.relations;
  data.areas = Array.isArray(payload.areas) ? payload.areas : createDefaultAreas();
  data.maternalPositions = payload.maternalPositions && typeof payload.maternalPositions === "object" ? payload.maternalPositions : {};
  refreshDerivedData();
  state.selectedEntityId = getDefaultSelectionForMode(state.mode);
  state.selectedAreaId = data.areas[0]?.id ?? null;
  state.selectedRelationId = null;
}

function saveToLocal() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeAppState()));
}

function cloneSerializedState() {
  return JSON.parse(JSON.stringify(serializeAppState()));
}

function pushHistory(label = "编辑") {
  state.historyPast.push({ label, snapshot: cloneSerializedState() });
  if (state.historyPast.length > 60) {
    state.historyPast.shift();
  }
  state.historyFuture = [];
  updateHistoryButtons();
}

function restoreSnapshot(snapshot) {
  applySerializedState(JSON.parse(JSON.stringify(snapshot)));
  saveToLocal();
  syncProjectForm();
  populateHouseholdSelects();
  render();
}

function undoLastChange() {
  const previous = state.historyPast.pop();
  if (!previous) return;
  state.historyFuture.push({ label: previous.label, snapshot: cloneSerializedState() });
  restoreSnapshot(previous.snapshot);
}

function redoLastChange() {
  const next = state.historyFuture.pop();
  if (!next) return;
  state.historyPast.push({ label: next.label, snapshot: cloneSerializedState() });
  restoreSnapshot(next.snapshot);
}

function updateHistoryButtons() {
  if (!dom.undoBtn || !dom.redoBtn) return;
  dom.undoBtn.disabled = !state.historyPast.length;
  dom.redoBtn.disabled = !state.historyFuture.length;
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

function getRelationById(id) {
  return data.relations.find((relation) => relation.id === id) ?? data.maternalData.relations.find((relation) => relation.id === id);
}

function getNextAreaId() {
  const maxId = data.areas.reduce((maxValue, area) => Math.max(maxValue, Number(String(area.id).replace("A", "")) || 0), 0);
  return `A${maxId + 1}`;
}

function reconcileHousehold(household) {
  household.members.forEach((member) => {
    if (!member.status) {
      member.status = member.role.includes("配偶") ? "婚入" : "在户";
    }
  });
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

function renderAreaControls() {
  if (!dom.areaControlList) return;
  dom.areaControlList.innerHTML = `
    <span class="meta-label">已有区域</span>
    ${data.areas
      .map(
        (area) => `
          <div class="area-control-card" data-area-control-id="${area.id}">
            <label>
              <span>名称</span>
              <input data-area-field="name" type="text" value="${area.name}" />
            </label>
            <label>
              <span>颜色</span>
              <input data-area-field="color" type="color" value="${area.color}" />
            </label>
            <label>
              <span>X</span>
              <input data-area-field="x" type="number" value="${Math.round(area.x)}" />
            </label>
            <label>
              <span>Y</span>
              <input data-area-field="y" type="number" value="${Math.round(area.y)}" />
            </label>
            <label>
              <span>宽</span>
              <input data-area-field="width" type="number" min="160" value="${Math.round(area.width)}" />
            </label>
            <label>
              <span>高</span>
              <input data-area-field="height" type="number" min="120" value="${Math.round(area.height)}" />
            </label>
            <button class="area-delete-button" type="button" data-delete-area-id="${area.id}">删除</button>
          </div>
        `
      )
      .join("")}
  `;

  dom.areaControlList.querySelectorAll("[data-area-field]").forEach((input) => {
    input.addEventListener("change", () => {
      const card = input.closest("[data-area-control-id]");
      const area = data.areas.find((candidate) => candidate.id === card.dataset.areaControlId);
      if (!area) return;
      pushHistory("编辑区域");
      updateAreaField(area, input.dataset.areaField, input.value);
      saveToLocal();
      renderMap();
      renderCanvasFocusCard();
    });
  });

  dom.areaControlList.querySelectorAll("[data-delete-area-id]").forEach((button) => {
    button.addEventListener("click", () => {
      pushHistory("删除区域");
      deleteArea(button.dataset.deleteAreaId);
      persistAndRender("区域已删除。");
    });
  });
}

function renderLegend() {
  dom.legend.innerHTML = getCurrentMode().types
    .map((type) => {
      const meta = relationTypes[type];
      return `
        <span class="legend-item">
          <svg class="legend-line" viewBox="0 0 54 12" aria-hidden="true">
            <line x1="4" y1="6" x2="50" y2="6" style="stroke:${meta.color};stroke-dasharray:${meta.dash};" />
          </svg>
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
  const memberGraph = renderHouseholdMemberGraph(selected);
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
                <span class="member-meta">${member.gender} · ${member.age} 岁 · ${member.role} · ${member.status ?? "在户"}</span>
                <p>${member.note}</p>
              </article>
            `
          )
          .join("")}
      </div>
    </div>

    <div>
      <span class="meta-label">户内成员关系</span>
      ${memberGraph}
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

function renderHouseholdMemberGraph(household) {
  const members = household.members;
  if (!members.length) {
    return `<div class="empty-state">这一户还没有录入成员。</div>`;
  }

  const byRole = {
    elders: members.filter((member) => member.role.includes("祖")),
    adults: members.filter((member) => member.role.includes("户主") || member.role.includes("配偶")),
    children: members.filter((member) => member.role.includes("子") || member.role.includes("继承")),
  };
  const rows = [
    { key: "elders", y: 36, members: byRole.elders },
    { key: "adults", y: 132, members: byRole.adults },
    { key: "children", y: 228, members: byRole.children },
  ];
  const positioned = new Map();
  const maxRowCount = Math.max(2, ...rows.map((row) => row.members.length));
  const graphWidth = Math.max(420, 84 + maxRowCount * 118);
  const nodeWidth = 92;
  const nodeHeight = 58;

  rows.forEach((row) => {
    const count = Math.max(1, row.members.length);
    row.members.forEach((member, index) => {
      const x = 56 + ((index + 1) * ((graphWidth - 112) / (count + 1))) - nodeWidth / 2;
      positioned.set(member.id, { ...member, x, y: row.y });
    });
  });

  const father = members.find((member) => member.role.includes("户主"));
  const mother = members.find((member) => member.role.includes("配偶"));
  const grandfather = byRole.elders.find((member) => member.gender === "男") ?? byRole.elders[0];
  const grandmother = byRole.elders.find((member) => member.gender === "女") ?? byRole.elders[1];

  const relationLines = [];
  function addLine(from, to, className) {
    const start = from ? positioned.get(from.id) : null;
    const end = to ? positioned.get(to.id) : null;
    if (!start || !end) return;
    relationLines.push(
      `<line class="member-link ${className}" x1="${start.x + nodeWidth / 2}" y1="${start.y + nodeHeight / 2}" x2="${end.x + nodeWidth / 2}" y2="${end.y + nodeHeight / 2}" />`
    );
  }

  addLine(grandfather, grandmother, "couple");
  addLine(father, mother, "couple");
  if (father) addLine(grandfather, father, "parent");
  if (father) addLine(grandmother, father, "parent");
  byRole.children.forEach((child) => {
    addLine(father, child, child.role.includes("继承") ? "inheritance" : "parent");
    addLine(mother, child, "parent");
  });

  const nodes = Array.from(positioned.values())
    .map(
      (member) => `
        <g class="member-node" transform="translate(${member.x}, ${member.y})">
          <rect width="${nodeWidth}" height="${nodeHeight}" rx="12" />
          <text x="${nodeWidth / 2}" y="22" text-anchor="middle">${shortenText(member.name, 7)}</text>
          <text x="${nodeWidth / 2}" y="43" text-anchor="middle">${member.gender} · ${shortenText(member.status ?? member.role, 5)}</text>
        </g>
      `
    )
    .join("");

  return `
    <div class="member-graph">
      <div class="member-graph-scroll">
      <svg viewBox="0 0 ${graphWidth} 312" width="${graphWidth}" aria-label="${household.shortName} 户内成员关系图">
        <text class="member-generation-label" x="10" y="24">祖辈</text>
        <text class="member-generation-label" x="10" y="120">父母辈</text>
        <text class="member-generation-label" x="10" y="216">子代</text>
        ${relationLines.join("")}
        ${nodes}
      </svg>
      </div>
      <div class="member-graph-legend">
        <span><i class="legend-solid"></i>亲子</span>
        <span><i class="legend-marriage"></i>配偶</span>
        <span><i class="legend-inherit"></i>继承候选</span>
      </div>
    </div>
  `;
}

function shortenText(text, maxLength) {
  const value = String(text ?? "");
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}

function buildHouseMapModel() {
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
      const fallbackX = 110 + col * 255;
      const fallbackY = 120 + laneIndex * 360 + row * 175;
      if (typeof household.mapX !== "number") household.mapX = fallbackX;
      if (typeof household.mapY !== "number") household.mapY = fallbackY;
      entities.push({
        ...household,
        x: household.mapX,
        y: household.mapY,
      });
    });
  });
  const entityIds = new Set(entities.map((entity) => entity.id));
  const relations = getVisibleRelations().filter((relation) => entityIds.has(relation.from) && entityIds.has(relation.to));
  const areaBounds = data.areas.reduce(
    (bounds, area) => ({
      minX: Math.min(bounds.minX, area.x - 120),
      minY: Math.min(bounds.minY, area.y - 120),
      maxX: Math.max(bounds.maxX, area.x + area.width + 120),
      maxY: Math.max(bounds.maxY, area.y + area.height + 120),
    }),
    { minX: -1200, minY: -900, maxX: 2600, maxY: 2100 }
  );
  const nodeBounds = entities.reduce(
    (bounds, entity) => ({
      minX: Math.min(bounds.minX, entity.x - 160),
      minY: Math.min(bounds.minY, entity.y - 160),
      maxX: Math.max(bounds.maxX, entity.x + 340),
      maxY: Math.max(bounds.maxY, entity.y + 240),
    }),
    areaBounds
  );
  return {
    entities,
    relations,
    bounds: nodeBounds,
    backgroundMarkup: renderAreaMarkup(),
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
      const fallbackX = 110 + branchIndex * 760 + slotCol * 260;
      const fallbackY = 150 + (household.generation - 1) * 235 + slotRow * 150;
      if (typeof household.patrilinealX !== "number") household.patrilinealX = fallbackX;
      if (typeof household.patrilinealY !== "number") household.patrilinealY = fallbackY;
      entities.push({
        ...household,
        x: household.patrilinealX,
        y: household.patrilinealY,
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
      const saved = data.maternalPositions?.[person.id];
      entities.push({
        ...person,
        x: saved?.x ?? baseX + offset.x,
        y: saved?.y ?? baseY + offset.y,
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

function renderAreaMarkup() {
  if (state.mode !== "house") return "";
  return data.areas
    .map(
      (area) => `
        <g class="canvas-area ${area.id === state.selectedAreaId ? "selected" : ""}" data-area-id="${area.id}" transform="translate(${area.x}, ${area.y})">
          <rect class="area-main" width="${area.width}" height="${area.height}" rx="28" style="fill:${area.color};" />
          <text class="area-title" x="26" y="42">${area.name}</text>
          <rect class="area-resize" data-area-resize-id="${area.id}" x="${area.width - 28}" y="${area.height - 28}" width="18" height="18" rx="5" />
        </g>
      `
    )
    .join("");
}

function buildGridMarkup(bounds) {
  const lines = [];
  const visibleLeft = (-state.viewport.x) / state.viewport.scale;
  const visibleTop = (-state.viewport.y) / state.viewport.scale;
  const visibleRight = visibleLeft + CANVAS_VIEW.width / state.viewport.scale;
  const visibleBottom = visibleTop + CANVAS_VIEW.height / state.viewport.scale;
  const minX = Math.min(bounds.minX ?? 0, visibleLeft) - 720;
  const minY = Math.min(bounds.minY ?? 0, visibleTop) - 720;
  const maxX = Math.max(bounds.maxX ?? bounds.width ?? CANVAS_VIEW.width, visibleRight) + 720;
  const maxY = Math.max(bounds.maxY ?? bounds.height ?? CANVAS_VIEW.height, visibleBottom) + 720;
  const startX = Math.floor(minX / 120) * 120;
  const startY = Math.floor(minY / 120) * 120;

  for (let x = startX; x <= maxX; x += 120) {
    lines.push(`<line x1="${x}" y1="${minY}" x2="${x}" y2="${maxY}" class="canvas-grid-line ${x % 240 === 0 ? "major" : ""}" />`);
  }
  for (let y = startY; y <= maxY; y += 120) {
    lines.push(`<line x1="${minX}" y1="${y}" x2="${maxX}" y2="${y}" class="canvas-grid-line ${y % 240 === 0 ? "major" : ""}" />`);
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
      const isDirectSelectedRelation = relation.from === selected.id || relation.to === selected.id;
      const drawFrom =
        state.mode === "house" && isDirectSelectedRelation
          ? entities.find((entity) => entity.id === selected.id)
          : from;
      const drawTo =
        state.mode === "house" && isDirectSelectedRelation
          ? entities.find((entity) => entity.id === (relation.from === selected.id ? relation.to : relation.from))
          : to;
      const { start, end } = getEdgeAnchors(drawFrom, drawTo);
      const deltaX = end.x - start.x;
      const deltaY = end.y - start.y;
      const curveX = start.x + deltaX / 2;
      const curveY = start.y + deltaY / 2 - Math.min(84, Math.max(24, Math.abs(deltaX) * 0.12));
      const isActive =
        state.mode === "patrilineal"
          ? selectedNeighborIds.has(relation.from) && selectedNeighborIds.has(relation.to)
          : relation.from === selected.id || relation.to === selected.id;
      const edgeClass = isActive ? "edge active" : selectedNeighborIds.size > 1 ? "edge recessed" : "edge related";
      const markerId = ["inheritance", "adoption", "patrilineal", "motherChild", "marriageMove"].includes(relation.type)
        ? `marker-${relation.type}`
        : "";

      return `
        <g class="edge-group" data-relation-id="${relation.id}">
          <path class="${edgeClass}" d="M ${start.x} ${start.y} Q ${curveX} ${curveY} ${end.x} ${end.y}" style="stroke:${meta.color};stroke-dasharray:${meta.dash};${markerId ? `marker-end:url(#${markerId});` : ""}" />
          <circle class="edge-dot edge-start" cx="${start.x}" cy="${start.y}" r="4.5" fill="${meta.color}" />
          ${markerId ? "" : `<circle class="edge-dot" cx="${end.x}" cy="${end.y}" r="4.5" fill="${meta.color}" />`}
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
      ${renderSvgMarkers()}
      ${buildGridMarkup(bounds)}
      ${laneMarkup}
      ${backgroundMarkup}
      ${edgeMarkup}
      ${nodeMarkup}
    </g>
  `;
  dom.map.setAttribute("viewBox", `0 0 ${CANVAS_VIEW.width} ${CANVAS_VIEW.height}`);

  dom.map.querySelectorAll("[data-node-id]").forEach((node) => {
    node.addEventListener("pointerdown", (event) => {
      beginHouseholdDrag(event, node.dataset.nodeId);
    });

    node.addEventListener("click", () => {
      if (state.suppressNextNodeClick) {
        state.suppressNextNodeClick = false;
        return;
      }
      selectEntity(node.dataset.nodeId, { revealDetails: false, centerMap: false });
    });
  });

  dom.map.querySelectorAll("[data-relation-id]").forEach((edge) => {
    edge.addEventListener("click", (event) => {
      event.stopPropagation();
      state.selectedRelationId = edge.dataset.relationId;
      renderCanvasFocusCard();
    });
  });

  dom.map.querySelectorAll("[data-area-id]").forEach((areaNode) => {
    areaNode.addEventListener("pointerdown", (event) => {
      beginAreaDrag(event, areaNode.dataset.areaId);
    });
    areaNode.addEventListener("click", () => {
      state.selectedAreaId = areaNode.dataset.areaId;
      renderCanvasFocusCard();
    });
    areaNode.addEventListener("dblclick", (event) => {
      event.stopPropagation();
      const area = data.areas.find((candidate) => candidate.id === areaNode.dataset.areaId);
      if (!area) return;
      const nextName = window.prompt("区域名称", area.name);
      if (!nextName) return;
      pushHistory("重命名区域");
      area.name = nextName.trim();
      state.selectedAreaId = area.id;
      persistAndRender("区域已重命名。");
    });
  });

  dom.map.querySelectorAll("[data-area-resize-id]").forEach((handle) => {
    handle.addEventListener("pointerdown", (event) => {
      beginAreaResize(event, handle.dataset.areaResizeId);
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
  const bodyText = state.showNames
    ? entity.members
        .slice(0, 2)
        .map((member, index) => `<text class="node-mini" x="18" y="${94 + index * 18}">${member.name}</text>`)
        .join("")
    : `<text class="node-mini" x="18" y="96">${previewText}</text>`;

  return `
    <g class="village-node ${isSelected ? "selected" : ""} ${isRelated ? "related" : ""}" data-node-id="${entity.id}" transform="translate(${entity.x}, ${entity.y})">
      <rect class="node-hitbox" x="0" y="0" width="220" height="128" rx="22" />
      <rect class="main" x="0" y="0" width="220" height="128" rx="22" />
      <rect class="node-accent" x="0" y="0" width="220" height="12" rx="22" style="fill:${accent};" />
      <text class="node-title" x="18" y="38">${entity.shortName}</text>
      <text class="node-meta" x="18" y="62">${entity.branch} · ${entity.lane}</text>
      <text class="node-relation-count" x="202" y="26" text-anchor="end">${relationCount} 条联系</text>
      ${bodyText}
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
  const position = getStoredEntityPosition(entity);
  const x = position.x;
  const y = position.y;
  if (state.mode === "matrilineal") {
    return { x: x + 100, y: y + 58 };
  }
  return { x: x + 110, y: y + 44 };
}

function getNodeBox(entity) {
  const position = getStoredEntityPosition(entity);
  const x = position.x;
  const y = position.y;
  if (state.mode === "matrilineal") {
    return { x, y, width: 200, height: 116 };
  }
  return { x, y, width: 220, height: 128 };
}

function getEdgeAnchors(from, to) {
  const fromBox = getNodeBox(from);
  const toBox = getNodeBox(to);
  const fromCenter = { x: fromBox.x + fromBox.width / 2, y: fromBox.y + fromBox.height / 2 };
  const toCenter = { x: toBox.x + toBox.width / 2, y: toBox.y + toBox.height / 2 };
  const deltaX = toCenter.x - fromCenter.x;
  const deltaY = toCenter.y - fromCenter.y;
  const horizontal = Math.abs(deltaX) >= Math.abs(deltaY);

  if (horizontal) {
    return {
      start: { x: deltaX >= 0 ? fromBox.x + fromBox.width : fromBox.x, y: fromCenter.y },
      end: { x: deltaX >= 0 ? toBox.x : toBox.x + toBox.width, y: toCenter.y },
    };
  }

  return {
    start: { x: fromCenter.x, y: deltaY >= 0 ? fromBox.y + fromBox.height : fromBox.y },
    end: { x: toCenter.x, y: deltaY >= 0 ? toBox.y : toBox.y + toBox.height },
  };
}

function renderSvgMarkers() {
  const directionalTypes = ["patrilineal", "inheritance", "adoption", "motherChild", "marriageMove"];
  return `
    <defs>
      ${directionalTypes
        .map((type) => {
          const meta = relationTypes[type];
          return `
            <marker id="marker-${type}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="${meta.color}" />
            </marker>
          `;
        })
        .join("")}
    </defs>
  `;
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
  const selectedRelation = state.selectedRelationId ? getRelationById(state.selectedRelationId) : null;

  if (state.mode === "house") {
    const selectedArea = data.areas.find((area) => area.id === state.selectedAreaId) ?? data.areas[0];
    dom.canvasFocusCard.innerHTML = `
      <div class="inspector-hero">
        <span class="inspector-kicker">当前家屋</span>
        <strong>${selected.name}</strong>
        <span>${selected.branch} · ${selected.lane} · ${selected.memberCount} 位成员 · ${relationCount} 条直接关系</span>
      </div>
      <details class="canvas-card-section area-editor" open>
        <summary>
          <span>画布区域</span>
          <button class="mini-button" type="button" data-area-action="add">新增</button>
        </summary>
        ${
          selectedArea
            ? `
              <label>
                <span>名称</span>
                <input data-focus-area-field="name" type="text" value="${selectedArea.name}" />
              </label>
              <label>
                <span>颜色</span>
                <input data-focus-area-field="color" type="color" value="${selectedArea.color}" />
              </label>
              <div class="area-editor-grid">
                <label>
                  <span>X</span>
                  <input data-focus-area-field="x" type="number" value="${Math.round(selectedArea.x)}" />
                </label>
                <label>
                  <span>Y</span>
                  <input data-focus-area-field="y" type="number" value="${Math.round(selectedArea.y)}" />
                </label>
                <label>
                  <span>宽</span>
                  <input data-focus-area-field="width" type="number" min="160" value="${Math.round(selectedArea.width)}" />
                </label>
                <label>
                  <span>高</span>
                  <input data-focus-area-field="height" type="number" min="120" value="${Math.round(selectedArea.height)}" />
                </label>
              </div>
              <button class="mini-button danger" type="button" data-area-action="delete">删除区域</button>
            `
            : `<span>还没有区域。点击“新增”创建一个区域。</span>`
        }
      </details>
      ${renderRelationEditorMarkup(selectedRelation)}
      ${renderQuickRelationFormMarkup(selected)}
    `;
    bindCanvasAreaEditor(selectedArea);
    bindRelationEditor(selectedRelation);
    bindQuickRelationForm(selected);
    return;
  }

  if (state.mode === "matrilineal") {
    const birthHouse = getHouseholdById(selected.birthHouseId);
    const residenceHouse = getHouseholdById(selected.residenceHouseId);
    dom.canvasFocusCard.innerHTML = `
      <div class="inspector-hero">
        <span class="inspector-kicker">当前人物</span>
        <strong>${selected.name}</strong>
        <span>${selected.focusLabel} · ${selected.age} 岁 · ${selected.role}</span>
        <span>生于 ${birthHouse?.shortName ?? "-"} · 居于 ${residenceHouse?.shortName ?? "-"} · ${relationCount} 条关系</span>
      </div>
      ${renderRelationEditorMarkup(selectedRelation)}
    `;
    bindRelationEditor(selectedRelation);
    return;
  }

  dom.canvasFocusCard.innerHTML = `
    <div class="inspector-hero">
      <span class="inspector-kicker">当前父系节点</span>
      <strong>${selected.name}</strong>
      <span>${selected.branch} · 第 ${selected.generation} 代 · ${selected.memberCount} 位成员 · ${relationCount} 条关系</span>
    </div>
    ${renderRelationEditorMarkup(selectedRelation)}
    ${renderQuickRelationFormMarkup(selected)}
  `;
  bindRelationEditor(selectedRelation);
  bindQuickRelationForm(selected);
}

function renderQuickRelationFormMarkup(selected) {
  if (state.mode === "matrilineal") return "";
  const allowedTypes = state.mode === "patrilineal" ? ["patrilineal", "inheritance", "marriage"] : ["house", "marriage", "inheritance", "adoption"];
  const options = data.households
    .filter((household) => household.id !== selected.id)
    .map((household) => `<option value="${household.id}">${household.shortName} · ${household.branch}</option>`)
    .join("");
  return `
    <details class="canvas-card-section quick-relation">
      <summary>快速添加关系</summary>
      <select data-quick-relation="target">${options}</select>
      <select data-quick-relation="type">
        ${allowedTypes.map((type) => `<option value="${type}">${relationTypes[type].label}</option>`).join("")}
      </select>
      <textarea data-quick-relation="note" rows="2" placeholder="说明 / 证据"></textarea>
      <button class="mini-button" type="button" data-quick-relation-action="add">添加关系</button>
    </details>
  `;
}

function bindQuickRelationForm(selected) {
  dom.canvasFocusCard.querySelector("[data-quick-relation-action='add']")?.addEventListener("click", () => {
    const target = dom.canvasFocusCard.querySelector("[data-quick-relation='target']")?.value;
    const type = dom.canvasFocusCard.querySelector("[data-quick-relation='type']")?.value;
    const note = dom.canvasFocusCard.querySelector("[data-quick-relation='note']")?.value.trim();
    if (!target || !type) return;
    pushHistory("快速添加关系");
    const relation = {
      id: getNextRelationId(),
      from: selected.id,
      to: target,
      type,
      strength: 0.8,
      note: note || "从画布快速添加的关系。",
    };
    data.relations.push(relation);
    state.selectedRelationId = relation.id;
    persistAndRender("已添加关系。");
  });
}

function renderRelationEditorMarkup(relation) {
  if (!relation) return "";
  const from = getHouseholdById(relation.from) ?? getMaternalPersonById(relation.from);
  const to = getHouseholdById(relation.to) ?? getMaternalPersonById(relation.to);
  const isEditable = data.relations.some((candidate) => candidate.id === relation.id);
  const editableTypes = ["house", "marriage", "inheritance", "adoption", "patrilineal"];
  const typeOptions = isEditable || editableTypes.includes(relation.type) ? editableTypes : [relation.type];
  return `
    <details class="canvas-card-section relation-editor" open>
      <summary>关系线</summary>
      <span>${from?.shortName ?? from?.name ?? relation.from} → ${to?.shortName ?? to?.name ?? relation.to}</span>
      <label>
        <span>类型</span>
        <select data-relation-field="type" ${isEditable ? "" : "disabled"}>
          ${typeOptions
            .map((type) => `<option value="${type}" ${relation.type === type ? "selected" : ""}>${relationTypes[type]?.label ?? type}</option>`)
            .join("")}
        </select>
      </label>
      <label>
        <span>说明 / 证据</span>
        <textarea data-relation-field="note" rows="3" ${isEditable ? "" : "readonly"}>${relation.note}</textarea>
      </label>
      ${
        isEditable
          ? `<button class="mini-button danger" type="button" data-relation-action="delete">删除关系</button>`
          : `<span>母系关系由人物资料自动生成，暂不直接编辑。</span>`
      }
    </details>
  `;
}

function bindRelationEditor(relation) {
  if (!relation || !data.relations.some((candidate) => candidate.id === relation.id)) return;
  dom.canvasFocusCard.querySelectorAll("[data-relation-field]").forEach((field) => {
    field.addEventListener("change", () => {
      pushHistory("编辑关系");
      relation[field.dataset.relationField] = field.value;
      persistAndRender("关系已更新。");
    });
  });
  dom.canvasFocusCard.querySelector("[data-relation-action='delete']")?.addEventListener("click", () => {
    pushHistory("删除关系");
    data.relations = data.relations.filter((candidate) => candidate.id !== relation.id);
    state.selectedRelationId = null;
    persistAndRender("关系已删除。");
  });
}

function bindCanvasAreaEditor(selectedArea) {
  dom.canvasFocusCard.querySelector("[data-area-action='add']")?.addEventListener("click", () => {
    const area = createAreaNearViewport();
    data.areas.push(area);
    state.selectedAreaId = area.id;
    persistAndRender(`已新增区域：${area.name}。`);
  });

  dom.canvasFocusCard.querySelector("[data-area-action='delete']")?.addEventListener("click", () => {
    if (!selectedArea) return;
    pushHistory("删除区域");
    deleteArea(selectedArea.id);
    persistAndRender("区域已删除。");
  });

  dom.canvasFocusCard.querySelectorAll("[data-focus-area-field]").forEach((input) => {
    input.addEventListener("change", () => {
      if (!selectedArea) return;
      pushHistory("编辑区域");
      updateAreaField(selectedArea, input.dataset.focusAreaField, input.value);
      saveToLocal();
      renderAreaControls();
      renderMap();
    });
  });
}

function createAreaNearViewport() {
  const visibleLeft = (-state.viewport.x) / state.viewport.scale;
  const visibleTop = (-state.viewport.y) / state.viewport.scale;
  return {
    id: getNextAreaId(),
    name: `区域 ${data.areas.length + 1}`,
    color: "#d7b46a",
    x: Math.round(visibleLeft + 120),
    y: Math.round(visibleTop + 120),
    width: 520,
    height: 280,
  };
}

function updateAreaField(area, field, value) {
  if (field === "name" || field === "color") {
    area[field] = value;
    return;
  }
  const numericValue = Number(value);
  if (field === "width") {
    area.width = Math.max(160, numericValue || 160);
    return;
  }
  if (field === "height") {
    area.height = Math.max(120, numericValue || 120);
    return;
  }
  if (field === "x" || field === "y") {
    area[field] = numericValue || 0;
  }
}

function deleteArea(areaId) {
  data.areas = data.areas.filter((area) => area.id !== areaId);
  state.selectedAreaId = data.areas[0]?.id ?? null;
}

function clampScale(scale) {
  return Math.max(0.18, Math.min(3.2, scale));
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

function getCanvasWorldPoint(clientX, clientY) {
  const rect = dom.map.getBoundingClientRect();
  return {
    x: (clientX - rect.left - state.viewport.x) / state.viewport.scale,
    y: (clientY - rect.top - state.viewport.y) / state.viewport.scale,
  };
}

function beginHouseholdDrag(event, householdId) {
  if (event.button !== 0) return;
  event.preventDefault();
  event.stopPropagation();
  const entity = state.mode === "matrilineal" ? getMaternalPersonById(householdId) : getHouseholdById(householdId);
  if (!entity) return;
  const position = getStoredEntityPosition(entity);
  const point = getCanvasWorldPoint(event.clientX, event.clientY);
  state.pendingHistory = cloneSerializedState();
  state.dragging = {
    active: true,
    type: "entity",
    pointerId: event.pointerId,
    startX: point.x,
    startY: point.y,
    originX: position.x,
    originY: position.y,
    targetId: entity.id,
    moved: false,
  };
  state.selectedEntityId = entity.id;
  dom.canvasFrame.classList.add("dragging");
  dom.map.setPointerCapture(event.pointerId);
}

function getStoredEntityPosition(entity) {
  if (state.mode === "matrilineal") {
    return data.maternalPositions?.[entity.id] ?? { x: entity.x, y: entity.y };
  }
  if (state.mode === "patrilineal") {
    return { x: entity.patrilinealX ?? entity.x, y: entity.patrilinealY ?? entity.y };
  }
  return { x: entity.mapX ?? entity.x, y: entity.mapY ?? entity.y };
}

function setStoredEntityPosition(entityId, x, y) {
  if (state.mode === "matrilineal") {
    data.maternalPositions[entityId] = { x, y };
    return;
  }
  const household = getHouseholdById(entityId);
  if (!household) return;
  if (state.mode === "patrilineal") {
    household.patrilinealX = x;
    household.patrilinealY = y;
    return;
  }
  household.mapX = x;
  household.mapY = y;
}

function beginAreaDrag(event, areaId) {
  if (state.mode !== "house" || event.button !== 0 || event.target.closest("[data-area-resize-id]")) return;
  event.preventDefault();
  event.stopPropagation();
  const area = data.areas.find((candidate) => candidate.id === areaId);
  if (!area) return;
  state.selectedAreaId = area.id;
  const point = getCanvasWorldPoint(event.clientX, event.clientY);
  state.pendingHistory = cloneSerializedState();
  state.dragging = {
    active: true,
    type: "area",
    pointerId: event.pointerId,
    startX: point.x,
    startY: point.y,
    originX: area.x,
    originY: area.y,
    targetId: area.id,
    moved: false,
  };
  dom.canvasFrame.classList.add("dragging");
  dom.map.setPointerCapture(event.pointerId);
}

function beginAreaResize(event, areaId) {
  if (state.mode !== "house" || event.button !== 0) return;
  event.preventDefault();
  event.stopPropagation();
  const area = data.areas.find((candidate) => candidate.id === areaId);
  if (!area) return;
  state.selectedAreaId = area.id;
  const point = getCanvasWorldPoint(event.clientX, event.clientY);
  state.pendingHistory = cloneSerializedState();
  state.dragging = {
    active: true,
    type: "area-resize",
    pointerId: event.pointerId,
    startX: point.x,
    startY: point.y,
    originX: area.width,
    originY: area.height,
    targetId: area.id,
    moved: false,
  };
  dom.canvasFrame.classList.add("dragging");
  dom.map.setPointerCapture(event.pointerId);
}

function updateCanvasDrag(event) {
  if (!state.dragging.active || state.dragging.pointerId !== event.pointerId) return false;
  const point = getCanvasWorldPoint(event.clientX, event.clientY);
  const deltaX = point.x - state.dragging.startX;
  const deltaY = point.y - state.dragging.startY;

  if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
    state.dragging.moved = true;
  }

  if (state.dragging.type === "entity") {
    setStoredEntityPosition(state.dragging.targetId, state.dragging.originX + deltaX, state.dragging.originY + deltaY);
    renderMap();
    return true;
  }

  if (state.dragging.type === "area") {
    const area = data.areas.find((candidate) => candidate.id === state.dragging.targetId);
    if (!area) return true;
    area.x = state.dragging.originX + deltaX;
    area.y = state.dragging.originY + deltaY;
    renderMap();
    return true;
  }

  if (state.dragging.type === "area-resize") {
    const area = data.areas.find((candidate) => candidate.id === state.dragging.targetId);
    if (!area) return true;
    area.width = Math.max(160, state.dragging.originX + deltaX);
    area.height = Math.max(120, state.dragging.originY + deltaY);
    renderMap();
    return true;
  }

  return false;
}

function finishCanvasDrag(event) {
  if (!state.dragging.active || state.dragging.pointerId !== event.pointerId) return false;
  const shouldPersist = ["entity", "area", "area-resize"].includes(state.dragging.type) && state.dragging.moved;
  const draggedType = state.dragging.type;
  state.dragging.active = false;
  state.dragging.pointerId = null;
  state.dragging.type = null;
  state.dragging.targetId = null;
  state.suppressNextNodeClick = shouldPersist && draggedType === "entity";
  state.dragging.moved = false;
  dom.canvasFrame.classList.remove("dragging");
  try {
    dom.map.releasePointerCapture(event.pointerId);
  } catch (error) {
    // The pointer may already have been released by the browser.
  }
  if (shouldPersist) {
    if (state.pendingHistory) {
      state.historyPast.push({ label: "拖动画布对象", snapshot: state.pendingHistory });
      if (state.historyPast.length > 60) state.historyPast.shift();
      state.historyFuture = [];
      state.pendingHistory = null;
      updateHistoryButtons();
    }
    saveToLocal();
    render();
  } else {
    state.pendingHistory = null;
  }
  return true;
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
  pushHistory("保存项目");
  data.project.name = dom.projectNameInput.value.trim() || data.project.name;
  data.project.location = dom.projectLocationInput.value.trim() || data.project.location;
  data.project.summary = dom.projectSummaryInput.value.trim() || data.project.summary;
  persistAndRender("项目已保存到本地。");
  closeModal();
}

function handleHouseholdSubmit(event) {
  event.preventDefault();
  pushHistory("新增家屋");
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
  pushHistory("新增成员");
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
    status: form.get("status")?.toString() || "在户",
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
  pushHistory("新增家屋关系");
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

function handleAreaSubmit(event) {
  event.preventDefault();
  pushHistory("新增区域");
  const form = new FormData(event.currentTarget);
  const area = {
    id: getNextAreaId(),
    name: form.get("area_name").toString().trim(),
    color: form.get("area_color").toString() || "#d7b46a",
    x: Number(form.get("area_x")) || 120,
    y: Number(form.get("area_y")) || 120,
    width: Math.max(160, Number(form.get("area_width")) || 520),
    height: Math.max(120, Number(form.get("area_height")) || 280),
  };
  data.areas.push(area);
  state.selectedAreaId = area.id;
  event.currentTarget.reset();
  persistAndRender(`已新增区域：${area.name}。`);
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
    if (event.target.closest("[data-node-id]") || event.target.closest("[data-area-id]")) return;
    state.dragging = {
      active: true,
      type: "pan",
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: state.viewport.x,
      originY: state.viewport.y,
      targetId: null,
      moved: false,
    };
    dom.canvasFrame.classList.add("dragging");
    dom.map.setPointerCapture(event.pointerId);
  });

  dom.map.addEventListener("pointermove", (event) => {
    if (!state.dragging.active || state.dragging.pointerId !== event.pointerId) return;
    if (updateCanvasDrag(event)) return;
    state.viewport.x = state.dragging.originX + (event.clientX - state.dragging.startX);
    state.viewport.y = state.dragging.originY + (event.clientY - state.dragging.startY);
    state.dragging.moved = true;
    renderMap();
  });

  function endDrag(event) {
    if (finishCanvasDrag(event)) return;
    if (!state.dragging.active || state.dragging.pointerId !== event.pointerId) return;
    state.dragging.active = false;
    state.dragging.pointerId = null;
    state.dragging.type = null;
    state.dragging.targetId = null;
    dom.canvasFrame.classList.remove("dragging");
    dom.map.releasePointerCapture(event.pointerId);
  }

  dom.map.addEventListener("pointerup", endDrag);
  dom.map.addEventListener("pointercancel", endDrag);
}

function bindControls() {
  dom.undoBtn.addEventListener("click", undoLastChange);
  dom.redoBtn.addEventListener("click", redoLastChange);
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
  dom.areaForm.addEventListener("submit", handleAreaSubmit);
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
  updateHistoryButtons();
  updateProjectCard();
  renderStats();
  renderModeSwitch();
  renderLayerFilters();
  renderAreaControls();
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
