<template>
  <div class="shell">
    <header class="topbar">
      <button class="wordmark" @click="navigate('landing')">
        <span class="wordmark-mark">B</span><span>BEACON</span>
      </button>
      <nav class="nav" aria-label="Primary navigation">
        <button :class="navClass('registry')" @click="navigate('registry')">Registry</button>
        <button :class="navClass('submit')" @click="navigate('submit')">Submit asset</button>
        <button :class="navClass('challenge')" @click="navigate('challenge')">Challenge</button>
        <button :class="navClass('proof')" @click="navigate('proof')">Live proof</button>
      </nav>
      <div class="network-chip"><span class="status-dot"></span>{{ configured ? 'Contract configured' : 'Read-only shell' }}</div>
    </header>

    <main>
      <section v-if="route === 'landing'" class="hero page-width">
        <div class="eyebrow">Collateral admission protocol / v0.1</div>
        <h1>Evidence before exposure.</h1>
        <p class="hero-copy">Beacon turns independent evidence review into a bounded collateral passport. Validators classify risk. The contract determines the only permitted LTV tier.</p>
        <div class="hero-actions">
          <button class="button button-dark" @click="navigate('registry')">Open registry</button>
          <button class="button button-quiet" @click="navigate('proof')">Inspect live proof -></button>
        </div>
        <div class="protocol-strip">
          <div><strong>8000</strong><span>CORE max LTV bps</span></div>
          <div><strong>6500</strong><span>STANDARD max LTV bps</span></div>
          <div><strong>2000</strong><span>WATCH max LTV bps</span></div>
          <div><strong>0</strong><span>REJECT max LTV bps</span></div>
        </div>
        <div class="content-grid landing-grid">
          <article class="explanatory-card">
            <span class="label">Protocol specification</span>
            <h2>Policy is deterministic.</h2>
            <p>A passport is bounded to peg, liquidity, redemption, backing, admin/governance, security, dependency, and confidence fields. No validator supplies an LTV number.</p>
          </article>
          <article class="explanatory-card ruled">
            <span class="label">Lifecycle</span>
            <h2>Versioned by design.</h2>
            <p>SUBMITTED -> EVALUATED -> verdict. A challenge moves the current verdict to CHALLENGED; reassessment writes a new passport version without deleting history.</p>
          </article>
        </div>
      </section>

      <section v-else-if="route === 'registry'" class="page-width page-section">
        <PageHeading eyebrow="Live contract surface" title="Collateral registry" copy="Only values read from the configured Beacon contract appear here." />
        <div v-if="!configured" class="notice warning">Set VITE_CONTRACT_ADDRESS to read live registry state.</div>
        <div v-else-if="loading" class="empty-state">Reading contract state...</div>
        <div v-else-if="error" class="notice error">{{ error }}</div>
        <div v-else-if="assets.length === 0" class="empty-state">No submitted assets in this contract.</div>
        <div v-else class="registry-table" role="table" aria-label="Collateral registry">
          <div class="table-row table-head" role="row"><span>Asset</span><span>Chain / identifier</span><span>Verdict</span><span>Max LTV</span></div>
          <button v-for="item in assets" :key="item.asset_id" class="table-row table-body" @click="openDetail(item.asset_id)">
            <span><strong>{{ item.name }}</strong><small>{{ item.symbol }} / {{ item.asset_id }}</small></span>
            <span>{{ item.chain }}<small>{{ item.token_address }}</small></span>
            <span><Badge :value="item.current_verdict || item.status" /></span>
            <span class="ltv">{{ item.current_ltv_bps }} <small>bps</small></span>
          </button>
        </div>
      </section>

      <section v-else-if="route === 'detail'" class="page-width page-section">
        <button class="back-link" @click="navigate('registry')">Back to registry</button>
        <PageHeading eyebrow="Live contract surface" :title="detailAsset?.name || 'Passport detail'" :copy="detailAsset ? `${detailAsset.symbol} / ${detailAsset.asset_id}` : 'Read a versioned passport from Beacon.'" />
        <div v-if="loading" class="empty-state">Reading passport...</div>
        <div v-else-if="error" class="notice error">{{ error }}</div>
        <div v-else-if="!detailAsset" class="empty-state">Asset not found in the configured contract.</div>
        <template v-else>
          <div class="detail-banner">
            <div><span class="label">Current verdict</span><Badge :value="detailAsset.current_verdict || detailAsset.status" /></div>
            <div><span class="label">Maximum LTV</span><strong class="large-number">{{ detailAsset.current_ltv_bps }} <small>bps</small></strong></div>
            <div><span class="label">Passport version</span><strong class="large-number">v{{ detailPassport?.version || 0 }}</strong></div>
          </div>
          <PassportGrid :passport="detailPassport" />
          <div class="hero-actions">
            <button class="button button-dark" @click="navigate('challenge')">Challenge current version</button>
            <button class="button button-quiet" @click="navigate('proof')">Open public proof</button>
          </div>
        </template>
      </section>

      <section v-else-if="route === 'submit'" class="page-width page-section form-section">
        <PageHeading eyebrow="Write surface" title="Submit an asset" copy="Submission creates a SUBMITTED record. It does not grant collateral eligibility until evaluation is finalized." />
        <form class="form-card" @submit.prevent="submitAsset">
          <div class="form-grid">
            <Field v-model="form.name" label="Name" required /><Field v-model="form.symbol" label="Symbol" required />
            <Field v-model="form.chain" label="Chain" required /><Field v-model="form.token_address" label="Token address" required />
            <Field v-model="form.target_currency" label="Target currency" required /><Field v-model="form.market_identifier" label="Market identifier" required />
            <Field v-model="form.issuer_url" label="Issuer URL" type="url" required /><Field v-model="form.redemption_url" label="Redemption URL" type="url" required />
            <Field v-model="form.reserve_backing_url" label="Reserve / backing URL" type="url" required /><Field v-model="form.security_url" label="Security URL" type="url" required />
            <Field v-model="form.governance_url" label="Governance URL" type="url" required />
          </div>
          <p class="form-note">Submitted URLs are untrusted evidence. Beacon accepts HTTPS sources with public-looking hostnames, but does not treat issuer claims as authenticated.</p>
          <div v-if="writeError" class="notice error">{{ writeError }}</div>
          <button class="button button-dark" :disabled="writing">{{ writing ? 'Broadcasting once...' : 'Submit asset' }}</button>
        </form>
      </section>

      <section v-else-if="route === 'challenge'" class="page-width page-section form-section">
        <PageHeading eyebrow="Governance surface" title="Challenge or reassess" copy="A challenge must target the current finalized passport version. Reassessment creates a new version; prior versions remain readable." />
        <div v-if="!configured" class="notice warning">Set VITE_CONTRACT_ADDRESS before using write surfaces.</div>
        <form v-else class="form-card" @submit.prevent="challengeAsset">
          <Field v-model="challengeForm.asset_id" label="Asset ID" placeholder="chain:token-address" required />
          <Field v-model="challengeForm.reason" label="Challenge reason" type="textarea" required />
          <div v-if="writeError" class="notice error">{{ writeError }}</div>
          <button class="button button-dark" :disabled="writing">{{ writing ? 'Broadcasting once...' : 'Challenge current passport' }}</button>
        </form>
        <div class="reassess-card">
          <div><span class="label">Reassessment</span><h2>After a challenge is finalized</h2><p>Use the same hash reconciliation lifecycle to request the next passport version.</p></div>
          <button class="button button-quiet" :disabled="writing || !challengeForm.asset_id" @click="reassessAsset">Reassess asset</button>
        </div>
      </section>

      <section v-else-if="route === 'proof'" class="page-width page-section">
        <PageHeading eyebrow="Public verification" title="Live proof" copy="Contract-derived state is marked live, and protocol explanation is marked specification." />
        <div class="proof-layout">
          <div class="proof-card">
            <span class="label live-label">LIVE CONTRACT DATA</span>
            <div v-if="!configured" class="empty-state">No contract address configured.</div>
            <div v-else-if="loading" class="empty-state">Reading live proof...</div>
            <div v-else-if="error" class="notice error">{{ error }}</div>
            <template v-else>
              <div class="proof-number">{{ liveCount }} <small>assets recorded</small></div>
              <div class="proof-line"><span>Contract</span><code>{{ contractAddress }}</code></div>
              <div class="proof-line"><span>Read method</span><code>asset_count()</code></div>
              <div class="proof-line"><span>Source</span><span>Beacon Intelligent Contract</span></div>
            </template>
          </div>
          <div class="proof-card explanatory-card">
            <span class="label">Protocol specification</span>
            <h2>How the proof is produced</h2>
            <p>Objective market fields are normalized and compared with strict equality. Semantic evidence is independently fetched by validators and checked with a bounded custom leader/validator pattern.</p>
            <p>The final verdict is mapped on contract from the risk passport and safety caps. No frontend value is a policy input.</p>
          </div>
        </div>
      </section>
    </main>
    <footer class="footer page-width"><span>BEACON / collateral admission</span><span>Read-only until a contract address is configured</span></footer>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import Badge from "./components/Badge.vue";
import Field from "./components/Field.vue";
import PageHeading from "./components/PageHeading.vue";
import PassportGrid from "./components/PassportGrid.vue";
import BeaconRegistry from "./services/beacon.js";

const registry = new BeaconRegistry();
const contractAddress = registry.contractAddress;
const configured = computed(() => registry.isConfigured());
const route = ref(readRoute());
const assets = ref([]);
const liveCount = ref(0);
const detailAsset = ref(null);
const detailPassport = ref(null);
const loading = ref(false);
const writing = ref(false);
const error = ref("");
const writeError = ref("");
const form = reactive(registry.emptySubmission());
const challengeForm = reactive({ asset_id: "", reason: "" });

function readRoute() {
  const value = decodeURIComponent(window.location.hash.slice(1) || "landing");
  return value.startsWith("passport/") ? "detail" : value;
}
function navigate(next) {
  window.location.hash = next;
  route.value = next.startsWith("passport/") ? "detail" : next;
  if (route.value === "registry" || route.value === "proof") loadRegistry();
  if (route.value === "detail") loadDetail(decodeURIComponent(next.slice("passport/".length)));
}
function navClass(name) { return { "nav-active": route.value === name }; }
function openDetail(assetId) { navigate(`passport/${encodeURIComponent(assetId)}`); }
async function loadRegistry() {
  if (!configured.value) return;
  loading.value = true; error.value = "";
  try {
    liveCount.value = await registry.assetCount();
    const ids = await registry.assetIds();
    assets.value = await Promise.all(ids.map((id) => registry.asset(id)));
  } catch (cause) { error.value = cause.message || "Unable to read the Beacon contract."; }
  finally { loading.value = false; }
}
async function loadDetail(assetId) {
  if (!configured.value) return;
  loading.value = true; error.value = "";
  try { detailAsset.value = await registry.asset(assetId); detailPassport.value = await registry.currentPassport(assetId); }
  catch (cause) { error.value = cause.message || "Unable to read the passport."; }
  finally { loading.value = false; }
}
async function submitAsset() {
  writing.value = true; writeError.value = "";
  try { const result = await registry.submitAsset({ ...form }); openDetail(result.state.asset_id); }
  catch (cause) { writeError.value = cause.message || "Submission failed; no automatic rebroadcast was attempted."; }
  finally { writing.value = false; }
}
async function challengeAsset() {
  writing.value = true; writeError.value = "";
  try { await registry.challengeAsset(challengeForm.asset_id, challengeForm.reason); await loadDetail(challengeForm.asset_id); }
  catch (cause) { writeError.value = cause.message || "Challenge failed; no automatic rebroadcast was attempted."; }
  finally { writing.value = false; }
}
async function reassessAsset() {
  writing.value = true; writeError.value = "";
  try { await registry.reassessAsset(challengeForm.asset_id); await loadDetail(challengeForm.asset_id); }
  catch (cause) { writeError.value = cause.message || "Reassessment failed; no automatic rebroadcast was attempted."; }
  finally { writing.value = false; }
}
function syncRoute() {
  const hash = window.location.hash.slice(1);
  route.value = hash.startsWith("passport/") ? "detail" : hash || "landing";
  if (route.value === "registry" || route.value === "proof") loadRegistry();
  if (route.value === "detail") loadDetail(decodeURIComponent(hash.slice("passport/".length)));
}
onMounted(() => { window.addEventListener("hashchange", syncRoute); syncRoute(); });
</script>
