<template>
  <div class="beacon-app" :class="{ 'focus-mode': focusMode }">
    <ParticleField :dimmed="route.name !== 'landing'" />
    <div class="ambient-grain" aria-hidden="true"></div>

    <header v-if="!focusMode" class="site-header">
      <div class="site-shell header-grid">
        <button class="brand" aria-label="Beacon home" @click="navigate('/')">
          <span class="brand-mark" aria-hidden="true">B</span>
          <span class="brand-name">BEACON</span>
        </button>

        <nav class="primary-nav" aria-label="Primary navigation">
          <button :class="navClass('registry')" @click="navigate('/assets')"><span>01</span> Registry</button>
          <button :class="navClass('submit')" @click="navigate('/submit')"><span>02</span> Submit</button>
          <button :class="navClass('proof')" @click="navigate('/proof')"><span>03</span> Proof</button>
        </nav>

        <div class="network-status" :aria-label="configured ? 'Bradbury live contract reads' : 'Bradbury not configured'">
          <span class="status-dot" :class="{ offline: !configured }"></span>
          <div>
            <span class="mono">BRADBURY · {{ configured ? 'LIVE' : 'OFFLINE' }}</span>
            <small>CHAIN 4221 / CONTRACT READS</small>
          </div>
        </div>
      </div>
    </header>

    <main class="site-main">
      <section v-if="route.name === 'landing'" class="landing-page">
        <div v-if="!focusMode" class="marquee-rail site-shell" aria-label="Beacon release notices">
          <div class="marquee-window" aria-hidden="true">
            <div class="marquee-track">
              <span>LIVE V5 COLLATERAL PASSPORT</span><i></i><span>FINALIZED ON TESTNET BRADBURY</span><i></i><span>COLLATERAL POLICY IS DETERMINISTIC</span><i></i><span>INDEPENDENT VALIDATOR EVIDENCE</span><i></i><span>V5 IDENTITY-BOUND CONSENSUS</span><i></i>
              <span>LIVE V5 COLLATERAL PASSPORT</span><i></i><span>FINALIZED ON TESTNET BRADBURY</span><i></i><span>COLLATERAL POLICY IS DETERMINISTIC</span><i></i><span>INDEPENDENT VALIDATOR EVIDENCE</span><i></i><span>V5 IDENTITY-BOUND CONSENSUS</span><i></i>
            </div>
          </div>
          <div class="marquee-actions"><button @click="navigate('/proof')">01 · VIEW PROOF</button><button @click="navigate('/assets')">02 · OPEN REGISTRY</button></div>
        </div>

        <div class="site-shell hero-layout">
          <div class="hero-main">
            <div class="section-index">00 / BEACON</div>
            <h1>KNOW WHAT<br />DESERVES TO<br />BACK LEVERAGE.</h1>
          </div>
          <div class="hero-context">
            <p class="hero-lede">Beacon converts independently verified collateral evidence into deterministic admission policy and versioned on-chain Passports.</p>
            <div class="hero-rule"></div>
            <div class="context-row"><span>01</span><span>PEG / LIQUIDITY / REDEMPTION</span></div>
            <div class="context-row"><span>02</span><span>BACKING / SECURITY / GOVERNANCE</span></div>
            <div class="context-row"><span>03</span><span>CONSENSUS → POLICY → PASSPORT</span></div>
          </div>
        </div>

        <div class="site-shell hero-actions-row">
          <div class="hero-actions"><button class="button button-accent" @click="navigate('/assets')">Explore collateral <span aria-hidden="true">↗</span></button><button class="button button-line" @click="navigate('/submit')">Submit asset <span aria-hidden="true">↗</span></button></div>
          <span class="mono muted">F / FOCUS MODE</span>
        </div>

        <div class="site-shell proof-strip" aria-label="Beacon release proof summary">
          <div class="proof-metric"><strong>V5</strong><span>IDENTITY-BOUND PROOF</span></div>
          <div class="proof-metric"><strong>12</strong><span>PUBLIC METHODS</span></div>
          <div class="proof-metric"><strong>4 / 8</strong><span>WRITES / VIEWS</span></div>
          <div class="proof-metric"><strong>92</strong><span>DIRECT TESTS</span></div>
          <div class="proof-metric"><strong>{{ proofPassport?.verdict || '—' }}</strong><span>PASSPORT V1 · {{ proofPassport?.max_ltv_bps ?? '—' }} BPS</span></div>
        </div>

        <div class="site-shell landing-registry">
          <div class="section-heading compact-heading"><div><span class="section-index">01 / REGISTRY PREVIEW</span><h2>Collateral, under scrutiny.</h2></div><button class="text-link" @click="navigate('/assets')">Open registry <span aria-hidden="true">↗</span></button></div>
          <div v-if="!configured" class="state-block">Configure the V5 contract to surface live collateral records.</div>
          <div v-else-if="loading" class="state-block">Reading live registry<span class="loading-mark">...</span></div>
          <div v-else-if="assets.length === 0" class="state-block">No assets have been submitted to this Beacon contract.</div>
          <div v-else class="preview-list"><button v-for="item in assets.slice(0, 3)" :key="item.asset_id" class="preview-row" @click="openDetail(item.asset_id)"><span class="preview-identity"><strong>{{ item.name }}</strong><small>{{ item.symbol }} / {{ item.chain }}</small></span><span class="mono">{{ displayState(item.passport).label }}</span><strong class="preview-ltv">{{ item.passport?.max_ltv_bps ?? '—' }} <small>BPS</small></strong><span aria-hidden="true" class="arrow">↗</span></button></div>
        </div>

        <div class="site-shell method-grid">
          <article class="method-cell"><span class="section-index">02 / METHOD</span><h2>Evidence is classified. Policy is fixed.</h2><p>Validators independently inspect objective and semantic evidence. The contract maps the bounded result through deterministic safety caps.</p></article>
          <article class="method-cell"><span class="section-index">03 / GENLAYER</span><h2>Independent eyes on external evidence.</h2><p>Consensus supplies structured facts. Beacon remains the policy authority and never asks a model to choose LTV.</p></article>
          <article class="method-cell"><span class="section-index">04 / GOVERNANCE</span><h2>Every challenge leaves a trail.</h2><p>Versioned passports preserve prior decisions. Reassessment is a new record, not an overwrite.</p></article>
          <article class="method-cell"><span class="section-index">05 / TRUST</span><h2>Untrusted sources. Explicit limits.</h2><p>Provenance, coverage, safety caps and evaluation failures stay visible in the passport.</p></article>
        </div>
      </section>

      <section v-else-if="route.name === 'registry'" class="page-shell">
        <div class="section-heading page-heading"><div><span class="section-index">01 / REGISTRY</span><h1>Collateral registry</h1><p>A live terminal for Beacon asset records. Every row is read from the configured contract.</p></div><div class="heading-meta"><span class="mono">TESTNET BRADBURY</span><span class="mono">{{ liveCount }} ASSET{{ liveCount === 1 ? '' : 'S' }}</span><span class="source-tag on-chain">LIVE CONTRACT</span></div></div>
        <div v-if="!configured" class="notice warning">V5 contract configuration is missing. No illustrative assets are shown.</div>
        <template v-else>
          <div class="terminal-toolbar"><div class="toolbar-count"><span class="mono">ASSET COUNT</span><strong>{{ liveCount }}</strong><span class="mono muted">ASSET_COUNT()</span></div><div class="toolbar-controls"><label class="search-field"><span class="sr-only">Search assets</span><span class="search-prefix">/</span><input v-model="search" type="search" placeholder="Search asset, symbol, chain or ID" /></label><label class="filter-field"><span class="sr-only">Filter verdict</span><select v-model="filter"><option v-for="option in filterOptions" :key="option" :value="option">{{ option === 'ALL' ? 'ALL STATES' : option.replaceAll('_', ' ') }}</option></select></label></div></div>
          <div v-if="loading" class="state-block">Reading asset IDs and current passports<span class="loading-mark">...</span></div>
          <div v-else-if="error" class="notice error">{{ error }}</div>
          <div v-else-if="filteredAssets.length === 0" class="state-block">{{ assets.length ? 'No assets match this view.' : 'No submitted assets in this contract yet.' }}</div>
          <div v-else class="registry-table-wrap"><table class="registry-table"><caption class="sr-only">Beacon collateral registry</caption><thead><tr><th>Asset</th><th>Network</th><th>Status</th><th>Passport</th><th>Verdict</th><th>Max LTV</th><th>Peg</th><th>Liquidity</th><th>Confidence</th><th>Updated</th></tr></thead><tbody><tr v-for="item in filteredAssets" :key="item.asset_id" tabindex="0" @click="openDetail(item.asset_id)" @keydown.enter="openDetail(item.asset_id)"><td><button class="table-link" @click.stop="openDetail(item.asset_id)"><strong>{{ item.name }}</strong><small>{{ item.symbol }} / {{ item.asset_id }}</small></button></td><td><span>{{ item.chain }}</span><small class="address">{{ item.token_address }}</small></td><td><span class="mono status-text">{{ item.lifecycle_status || '—' }}</span></td><td><span class="mono">V{{ item.passport?.version || 0 }}</span></td><td><span class="verdict-text" :class="riskClass(displayState(item.passport).label)">{{ displayState(item.passport).label }}</span></td><td class="ltv-cell">{{ item.passport?.max_ltv_bps ?? 0 }}<small>BPS</small></td><td>{{ item.passport?.peg_risk || '—' }}</td><td>{{ item.passport?.liquidity_risk || '—' }}</td><td>{{ item.passport?.confidence || '—' }}</td><td>{{ item.passport?.evaluated_at || item.passport?.market_timestamp || '—' }}</td></tr></tbody></table></div>
        </template>
      </section>

      <section v-else-if="route.name === 'detail'" class="page-shell">
        <button class="back-link" @click="navigate('/assets')">← Back to registry</button>
        <div v-if="!configured" class="notice warning">V5 contract configuration is missing. No passport is fabricated.</div>
        <div v-else-if="loading" class="state-block">Reading asset, passport history and challenges<span class="loading-mark">...</span></div>
        <div v-else-if="error" class="notice error">{{ error }}</div>
        <div v-else-if="!detailAsset" class="state-block">Asset not found in the configured Beacon contract.</div>
        <template v-else>
          <div class="dossier-heading"><div><span class="section-index">02 / COLLATERAL PASSPORT</span><h1>{{ detailAsset.name }}</h1><div class="asset-subline"><span class="asset-symbol">{{ detailAsset.symbol }}</span><span>{{ detailAsset.chain }}</span><span class="mono">{{ detailAsset.asset_id }}</span></div></div><div class="dossier-status"><span class="mono">CURRENT STATE</span><strong :class="riskClass(displayState(detailPassport).label)">{{ displayState(detailPassport).label }}</strong><span class="mono">V{{ detailPassport?.version || 0 }} / {{ detailAsset.lifecycle_status }}</span></div></div>

          <div class="policy-band"><div><span class="section-index">COLLATERAL POLICY</span><strong class="policy-verdict" :class="riskClass(displayState(detailPassport).label)">{{ displayState(detailPassport).label }}</strong></div><div><span class="section-index">MAXIMUM LTV</span><strong class="policy-number">{{ detailPassport?.max_ltv_bps ?? 0 }} <small>BPS</small></strong></div><div><span class="section-index">CONFIDENCE</span><strong class="policy-small">{{ detailPassport?.confidence || 'UNKNOWN' }}</strong></div><div><span class="section-index">FAILURE STATE</span><strong class="policy-small">{{ detailPassport?.failure_state || 'NOT_EVALUATED' }}</strong></div></div>
          <div class="source-legend"><span class="source-tag on-chain">ON-CHAIN</span> identity, verdict, LTV, versions <span class="source-tag validator">VALIDATOR-DERIVED</span> risk fields and status <span class="source-tag external">EXTERNAL EVIDENCE</span> linked source material</div>

          <section class="passport-artifact"><div class="passport-corner top-left"></div><div class="passport-corner top-right"></div><div class="passport-corner bottom-left"></div><div class="passport-corner bottom-right"></div><div class="passport-artifact-head"><span class="section-index">BEACON / MACHINE-READABLE RECORD</span><span class="mono">PASSPORT V{{ detailPassport?.version || 0 }}</span></div><div class="passport-artifact-title"><span>BEACON</span><h2>COLLATERAL<br />PASSPORT</h2></div><div class="passport-artifact-grid"><div><span class="section-index">ASSET ID</span><code>{{ detailAsset.asset_id }}</code></div><div><span class="section-index">VERDICT</span><strong :class="riskClass(displayState(detailPassport).label)">{{ displayState(detailPassport).label }}</strong></div><div><span class="section-index">MAX LTV</span><strong>{{ detailPassport?.max_ltv_bps ?? 0 }} BPS</strong></div><div><span class="section-index">POLICY BASIS</span><span>{{ detailPassport?.policy_basis || '—' }}</span></div><div><span class="section-index">EVIDENCE DIGEST</span><CopyHash :value="detailPassport?.evidence_digest || '—'" label="Copy evidence digest" /></div><div><span class="section-index">EVALUATION MARKER</span><span>{{ detailPassport?.evaluated_at || detailPassport?.market_timestamp || '—' }}</span></div></div><div class="passport-calibration"><span></span><span></span><span></span><span></span><small>V5 / BRADBURY / {{ detailPassport?.objective_coverage || 'UNKNOWN' }}</small></div></section>

          <section class="section-block"><div class="section-heading block-heading"><div><span class="section-index">03 / RISK MATRIX</span><h2>Policy-critical dimensions</h2></div><span class="source-tag validator">VALIDATOR-DERIVED</span></div><div v-if="detailPassport?.version" class="risk-matrix"><RiskCell v-for="(field, index) in primaryRiskFields" :key="field.key" :index="index + 1" :label="field.label" :value="detailPassport[field.key]" :provenance="field.provenance" /></div><div v-else class="state-block">No finalized passport has been written yet.</div></section>

          <section class="section-block"><div class="section-heading block-heading"><div><span class="section-index">04 / IDENTITY</span><h2>Verified asset binding</h2></div><span class="source-tag validator">{{ detailPassport?.identity_status || detailAsset.identity_status || 'UNVERIFIED' }}</span></div><div class="identity-grid"><div><span class="section-index">CHAIN</span><code>{{ detailPassport?.canonical_chain || detailAsset.chain }}</code></div><div><span class="section-index">TOKEN ADDRESS</span><code>{{ detailPassport?.canonical_token_address || detailAsset.token_address }}</code></div><div><span class="section-index">COINGECKO ID</span><code>{{ detailPassport?.primary_market_id || detailAsset.market_identifier || 'UNVERIFIED' }}</code></div><div><span class="section-index">COINPAPRIKA ID</span><code>{{ detailPassport?.secondary_market_id || detailAsset.secondary_market_identifier || 'UNVERIFIED' }}</code></div><div><span class="section-index">ISSUER AUTHORITY</span><strong>{{ detailPassport?.official_issuer_domain || detailAsset.official_issuer_domain || 'UNVERIFIED' }}</strong></div><div><span class="section-index">IDENTITY STATUS</span><strong>{{ detailPassport?.identity_status || detailAsset.identity_status || 'UNVERIFIED' }}</strong></div><div><span class="section-index">IDENTITY DIGEST</span><CopyHash :value="detailPassport?.identity_digest || detailAsset.identity_digest || '—'" label="Copy identity digest" /></div></div></section>
          <div class="detail-grid"><section class="data-section"><div class="section-heading block-heading"><div><span class="section-index">05 / OBJECTIVE</span><h2>Address-bound market evidence</h2></div><span class="source-tag validator">VALIDATOR-DERIVED</span></div><dl class="data-list"><div><dt>Coverage</dt><dd>{{ detailPassport?.objective_coverage || '—' }}</dd></div><div><dt>Primary status</dt><dd>{{ detailPassport?.primary_source_status || '—' }}</dd></div><div><dt>Secondary status</dt><dd>{{ detailPassport?.secondary_source_status || '—' }}</dd></div><div><dt>Peg deviation</dt><dd>{{ detailPassport?.peg_deviation_bps ?? '—' }} BPS</dd></div><div><dt>Secondary deviation</dt><dd>{{ detailPassport?.secondary_peg_deviation_bps ?? '—' }} BPS</dd></div><div><dt>Market marker</dt><dd>{{ detailPassport?.market_timestamp || '—' }}</dd></div></dl></section><section class="data-section"><div class="section-heading block-heading"><div><span class="section-index">06 / POLICY TRACE</span><h2>Deterministic output</h2></div><span class="source-tag on-chain">ON-CHAIN</span></div><dl class="data-list"><div><dt>Safety cap</dt><dd>{{ detailPassport?.safety_cap || '—' }}</dd></div><div><dt>Policy basis</dt><dd>{{ detailPassport?.policy_basis || '—' }}</dd></div><div><dt>Failure state</dt><dd>{{ detailPassport?.failure_state || 'NOT_EVALUATED' }}</dd></div><div><dt>Challenge set</dt><dd>{{ detailPassport?.challenge_count || 0 }} evaluated / {{ detailPassport?.supported_challenge_count || 0 }} supported</dd></div><div><dt>Challenge-set digest</dt><dd class="break-value">{{ detailPassport?.challenge_set_digest || 'INITIAL EVALUATION' }}</dd></div></dl></section></div>

          <section class="section-block"><div class="section-heading block-heading"><div><span class="section-index">06 / SEMANTIC PROVENANCE</span><h2>Source relationship</h2></div><span class="source-tag validator">VALIDATOR-DERIVED</span></div><div class="provenance-matrix"><div v-for="field in provenanceFields" :key="field.key"><span class="section-index">{{ field.label }}</span><strong>{{ detailPassport?.[field.key] || 'UNKNOWN' }}</strong></div></div></section>

          <section class="section-block"><div class="section-heading block-heading"><div><span class="section-index">08 / EVIDENCE SOURCES</span><h2>Authenticated source manifest</h2></div><span class="source-tag external">AUTHORITY + ASSET BINDING</span></div><div class="evidence-list"><a v-for="source in evidenceSources" :key="source.label" :href="source.url" target="_blank" rel="noreferrer noopener"><span class="evidence-role">{{ source.label }}</span><code>{{ source.url }}</code><span aria-hidden="true">↗</span></a></div><dl class="data-list source-status-list"><div v-for="source in evidenceSources" :key="source.label + '-status'"><dt>{{ source.label }}</dt><dd>{{ source.authority }} / {{ source.binding }}</dd></div></dl></section>

          <div class="detail-grid"><section class="data-section"><div class="section-heading block-heading"><div><span class="section-index">09 / PASSPORT HISTORY</span><h2>Immutable versions</h2></div><span class="mono">{{ historyRows.length }} RECORD{{ historyRows.length === 1 ? '' : 'S' }}</span></div><div v-if="historyRows.length" class="history-list"><div v-for="passport in historyRows" :key="passport.version" class="history-row"><span class="history-version">V{{ passport.version }}</span><span class="history-verdict" :class="riskClass(passport.verdict)">{{ passport.verdict || passport.failure_state }}</span><span>{{ passport.max_ltv_bps }} BPS</span><small>{{ passport.evaluated_at || passport.market_timestamp || 'MARKER UNAVAILABLE' }}</small></div></div><div v-else class="state-block">No passport history is available.</div></section><section class="data-section"><div class="section-heading block-heading"><div><span class="section-index">10 / CHALLENGES</span><h2>Individual adjudications</h2></div><span class="mono">{{ challengeRows.length }} RECORD{{ challengeRows.length === 1 ? '' : 'S' }}</span></div><div v-if="challengeRows.length" class="history-list"><div v-for="challenge in challengeRows" :key="challenge.challenge_id" class="history-row challenge-history"><span class="history-version">{{ challenge.category }}</span><span>{{ challenge.reason }}</span><small>V{{ challenge.target_version }} / {{ challenge.status }} / {{ challenge.evaluation_result || 'PENDING' }} / {{ challenge.evaluation_reason_code || 'PENDING' }} / {{ challenge.resolution_version ? 'RESOLVED V' + challenge.resolution_version : 'OPEN' }}</small><code>{{ challenge.evidence_url }}</code><code>{{ challenge.evidence_digest || 'DIGEST PENDING' }}</code></div></div><div v-else class="state-block">No challenges recorded.</div></section></div>

          <div v-if="writeError" class="notice error">{{ writeError }}</div><div class="detail-actions"><button v-if="detailAsset.lifecycle_status === 'SUBMITTED'" class="button button-accent" :disabled="writing" @click="evaluateAsset(detailAsset.asset_id)">{{ writing ? 'Preparing evaluation...' : 'Evaluate asset' }} <span aria-hidden="true">↗</span></button><button v-if="detailPassport?.version" class="button button-line" @click="navigate(`/assets/${encodeURIComponent(detailAsset.asset_id)}/challenge`)">Challenge current version <span aria-hidden="true">↗</span></button><button v-if="detailAsset.lifecycle_status === 'CHALLENGED'" class="button button-line" :disabled="writing" @click="reassessAsset(detailAsset.asset_id)">{{ openChallengeCount }} OPEN CHALLENGES WILL BE EVALUATED <span aria-hidden="true">↗</span></button><button class="button button-line" @click="navigate('/proof')">Open public proof <span aria-hidden="true">↗</span></button></div>
        </template>
      </section>

      <section v-else-if="route.name === 'submit'" class="page-shell form-shell"><div class="workflow-layout"><div class="workflow-intro"><span class="section-index">10 / SUBMIT ASSET</span><h1>Submit collateral<br />for evaluation.</h1><p>A serious registration flow for a persistent public collateral record. Submission is not admission; policy follows evidence and consensus.</p><div class="workflow-index"><div v-for="(step, index) in submitSteps" :key="step" :class="{ active: submitStep === index + 1, complete: submitStep > index + 1 }"><span>0{{ index + 1 }}</span><strong>{{ step }}</strong><small>{{ index < submitStep ? 'COMPLETE' : index === submitStep - 1 ? 'CURRENT' : 'PENDING' }}</small></div></div><div class="fee-marker"><span class="section-index">TESTNET V1 / FIXED FEE</span><strong>1 GEN</strong><span>Exact, non-refundable registration fee held by the protocol for anti-spam.</span></div></div><div class="form-surface"><form v-if="submitStep < 5" @submit.prevent="advanceSubmit"><div v-if="submitStep === 1" class="form-step"><span class="section-index">STEP 01 / IDENTITY ROOT</span><h2>Start with chain + address.</h2><div class="form-grid"><Field v-model="form.chain" label="Canonical chain" required /><Field v-model="form.token_address" label="EVM token address" required /></div><p class="form-note">Ethereum mainnet is submitted as <code>eip155:1</code>. Name, symbol and market IDs are optional claims only; Beacon never treats them as identity.</p></div><div v-else-if="submitStep === 2" class="form-step"><span class="section-index">STEP 02 / VERIFIED IDENTITY</span><h2>Provider IDs are derived after submit.</h2><div class="form-grid"><Field v-model="form.target_currency" label="Target currency" required /></div><p class="form-note">Beacon independently resolves the exact address through CoinGecko and CoinPaprika address-bound endpoints. Conflicts fail closed. Optional claims remain untrusted and are not displayed as authority.</p></div><div v-else-if="submitStep === 3" class="form-step"><span class="section-index">STEP 03 / SEMANTIC SOURCES</span><h2>Assign one source to each role.</h2><div class="form-grid"><Field v-model="form.issuer_url" label="Issuer URL" type="url" required /><Field v-model="form.redemption_url" label="Redemption URL" type="url" required /><Field v-model="form.reserve_backing_url" label="Reserve / backing URL" type="url" required /><Field v-model="form.security_url" label="Security URL" type="url" required /><Field v-model="form.governance_url" label="Governance URL" type="url" required /></div><p class="form-note">HTTPS syntax is only a transport precondition. V5 verifies authority and exact address binding before semantic evidence can contribute.</p></div><div v-else class="form-step"><span class="section-index">STEP 04 / REVIEW</span><h2>Register the evidence bundle.</h2><dl class="review-list"><div><dt>Identity root</dt><dd>{{ form.chain }} / {{ form.token_address }}</dd></div><div><dt>Provider IDs</dt><dd>DERIVED BY BEACON / NOT SUBMITTED AUTHORITY</dd></div><div><dt>Semantic roles</dt><dd>{{ form.issuer_url }}<br />{{ form.redemption_url }}<br />{{ form.reserve_backing_url }}<br />{{ form.security_url }}<br />{{ form.governance_url }}</dd></div><div><dt>Registration fee</dt><dd><strong>1 GEN</strong> exact / fixed / held</dd></div></dl><p class="form-note">Review every source before the wallet prompt. Beacon broadcasts once and reconciles the same hash.</p></div><div v-if="formErrors.length" class="notice error"><div v-for="message in formErrors" :key="message">{{ message }}</div></div><div class="form-actions"><button v-if="submitStep > 1" type="button" class="button button-line" @click="submitStep -= 1">Back</button><button class="button button-accent" :disabled="writing">{{ submitStep === 4 ? 'Confirm and submit once' : 'Continue' }} <span aria-hidden="true">↗</span></button></div></form><div v-else class="transaction-panel"><span class="section-index">STEP 05 / BROADCAST</span><h2>Registration status</h2><p>Beacon broadcasts once. If reconciliation is ambiguous, use the saved transaction hash in the status drawer and choose Check again.</p><div class="transaction-state"><span class="status-dot"></span><span>Transaction lifecycle active</span></div></div></div></div></section>

      <section v-else-if="route.name === 'challenge'" class="page-shell form-shell"><button class="back-link" @click="navigate(`/assets/${encodeURIComponent(route.assetId)}`)">← Back to passport</button><div class="workflow-layout challenge-layout"><div class="workflow-intro"><span class="section-index">11 / GOVERNANCE</span><h1>Amend the<br />evidence record.</h1><p>A challenge requests reassessment of a finalized passport. It does not erase history or promise a new tier.</p><div class="fee-marker"><span class="section-index">TESTNET V1 / FIXED FEE</span><strong>0.25 GEN</strong><span>Exact, non-refundable challenge fee held by the protocol for anti-spam.</span></div></div><div class="form-surface"><div v-if="!configured" class="notice warning">V5 contract configuration is missing before using write surfaces.</div><div v-else-if="challengeLoading" class="state-block">Reading current passport<span class="loading-mark">...</span></div><div v-else-if="challengeError" class="notice error">{{ challengeError }}</div><form v-else @submit.prevent="submitChallenge"><span class="section-index">PASSPORT DISPUTE / EVIDENCE AMENDMENT</span><h2>Challenge current version.</h2><div class="challenge-target"><span class="section-index">TARGET PASSPORT</span><code>{{ challengeAssetState?.asset_id || route.assetId }}</code><strong>V{{ challengePassport?.version || 0 }} / {{ challengePassport?.verdict || challengePassport?.failure_state || 'NOT EVALUATED' }}</strong></div><div class="form-grid"><label class="field"><span class="field-label">Challenge category *</span><select v-model="challengeForm.category" class="field-input" required><option disabled value="">Choose a category</option><option v-for="category in categories" :key="category" :value="category">{{ category }}</option></select></label><Field v-model="challengeForm.evidence_url" label="New evidence URL" type="url" required /></div><Field v-model="challengeForm.reason" label="Bounded reason" type="textarea" required /><p class="form-note">V5 evaluates every open challenge for the current passport with category, reason and independently fetched asset-bound evidence. A failed reassessment leaves all challenges open.</p><div v-if="challengeErrors.length" class="notice error"><div v-for="message in challengeErrors" :key="message">{{ message }}</div></div><div v-if="writeError" class="notice error">{{ writeError }}</div><div class="form-actions"><button class="button button-accent" :disabled="writing">Challenge v{{ challengePassport?.version || '?' }} <span aria-hidden="true">↗</span></button><button type="button" class="button button-line" :disabled="writing || !challengePassport || challengeAssetState?.lifecycle_status !== 'CHALLENGED'" @click="reassessAsset(route.assetId)">Reassess {{ openChallengeCount || 'all open' }} open challenges will be evaluated <span aria-hidden="true">↗</span></button></div></form></div></div></section>

      <section v-else-if="route.name === 'proof'" class="page-shell proof-page"><div class="section-heading page-heading"><div><span class="section-index">12 / PUBLIC VERIFICATION</span><h1>V5 remediation proof</h1><p>Frozen source and Bradbury receipts are shown here. V5 is not production-bound until evaluation reaches consensus.</p></div><div class="heading-meta"><span class="mono">BEACON V5</span><span class="mono">SOURCE FROZEN</span><span class="source-tag validator">FINALIZED RECEIPTS</span></div></div><div class="proof-banner"><span class="status-dot"></span><strong>TESTNET BRADBURY / V5 CANDIDATE</strong><span class="mono">CHAIN 4221</span></div><div class="proof-ledger"><div class="ledger-title"><span class="section-index">RELEASE LEDGER</span><span class="mono">VERIFIED FACTS</span></div><div class="ledger-row"><span>CONTRACT</span><CopyHash :value="releaseProof.contractAddress" label="Copy V5 contract address" /></div><div class="ledger-row"><span>SOURCE SHA256</span><CopyHash :value="releaseProof.sourceSha256" label="Copy V5 source SHA256" /></div><div class="ledger-row"><span>DEPLOYMENT TX</span><CopyHash :value="releaseProof.deploymentTx" label="Copy deployment transaction" /></div><div class="ledger-row"><span>SUBMIT TX</span><CopyHash :value="releaseProof.submitTx" label="Copy submission transaction" /></div><div class="ledger-row"><span>EVALUATE TX</span><CopyHash :value="releaseProof.evaluateTx" label="Copy evaluation transaction" /></div><div class="ledger-row"><span>PASSPORT</span><strong>V{{ releaseProof.passportVersion }} / {{ proofPassport?.verdict || releaseProof.verdict }} / {{ proofPassport?.max_ltv_bps ?? releaseProof.maxLtvBps }} BPS</strong></div><div class="ledger-row"><span>CONSENSUS</span><strong>{{ releaseProof.evaluateStatus }}</strong><small>{{ releaseProof.validatorSummary }}</small></div></div><div v-if="!configured" class="notice warning">V5 contract configuration is missing; no live read is shown.</div><div v-else-if="loading" class="state-block">Reading V5 registry and passport<span class="loading-mark">...</span></div><div v-else-if="error" class="notice error">{{ error }}</div><template v-else><div class="proof-observation-grid"><section class="data-section"><div class="section-heading block-heading"><div><span class="section-index">LIVE CONTRACT READ</span><h2>Current state</h2></div><span class="source-tag on-chain">ON-CHAIN</span></div><dl class="data-list"><div><dt>Asset count</dt><dd>{{ liveCount }}</dd></div><div><dt>Asset ID</dt><dd class="break-value">{{ proofAsset?.asset_id || releaseProof.assetId }}</dd></div><div><dt>Lifecycle</dt><dd>{{ proofAsset?.lifecycle_status || 'UNAVAILABLE' }}</dd></div><div><dt>Passport version</dt><dd>V{{ proofPassport?.version || releaseProof.passportVersion }}</dd></div><div><dt>Verdict</dt><dd :class="riskClass(proofPassport?.verdict || releaseProof.verdict)">{{ proofPassport?.verdict || releaseProof.verdict }}</dd></div><div><dt>Max LTV</dt><dd>{{ proofPassport?.max_ltv_bps ?? releaseProof.maxLtvBps }} BPS</dd></div></dl></section><section class="data-section"><div class="section-heading block-heading"><div><span class="section-index">EVALUATION RESULT</span><h2>Fail-closed is part of the proof.</h2></div><span class="source-tag validator">VALIDATOR-DERIVED</span></div><p class="proof-explanation">Beacon recorded <strong>{{ proofPassport?.verdict || releaseProof.verdict || 'REJECT' }}</strong> at <strong>{{ proofPassport?.max_ltv_bps ?? releaseProof.maxLtvBps }} BPS</strong> after an identity-bound evaluation attempt. No Passport was persisted because this evaluation did not reach consensus.</p><dl class="data-list"><div><dt>Policy basis</dt><dd>{{ proofPassport?.policy_basis || releaseProof.policyBasis || '—' }}</dd></div><div><dt>Failure state</dt><dd>{{ proofPassport?.failure_state || 'NONE' }}</dd></div><div><dt>Identity status</dt><dd>{{ proofPassport?.identity_status || 'UNAVAILABLE' }}</dd></div><div><dt>Identity digest</dt><dd>{{ proofPassport?.identity_digest || 'UNAVAILABLE' }}</dd></div><div><dt>Validator receipts</dt><dd>{{ releaseProof.validatorSummary || 'UNAVAILABLE BEFORE DEPLOYMENT' }}</dd></div></dl></section></div></template></section>
      <section v-else class="page-shell"><div class="section-heading page-heading"><div><span class="section-index">BEACON</span><h1>Surface not found</h1><p>Return to the collateral registry or Beacon home.</p></div></div><button class="button button-accent" @click="navigate('/')">Go home <span aria-hidden="true">↗</span></button></section>
    </main>

    <footer v-if="!focusMode" class="site-footer"><div class="site-shell footer-grid"><span>BEACON / COLLATERAL ADMISSION</span><span>V5 / BRADBURY / PUBLIC READS</span><span class="mono">F TO FOCUS</span></div></footer>
    <button class="focus-control" :aria-pressed="focusMode" aria-label="Toggle focus mode" @click="focusMode = !focusMode"><span class="mono">{{ focusMode ? 'ESC' : 'F' }}</span><span>{{ focusMode ? 'RESTORE' : 'FOCUS' }}</span></button>
    <TransactionStatus :state="tx" @close="tx.open = false" @recover="recoverWrite" />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import CopyHash from "./components/CopyHash.vue";
import Field from "./components/Field.vue";
import ParticleField from "./components/ParticleField.vue";
import RiskCell from "./components/RiskCell.vue";
import TransactionStatus from "./components/TransactionStatus.vue";
import BeaconRegistry, { CHALLENGE_CATEGORIES as CONTRACT_CATEGORIES } from "./services/beacon.js";
import { filterRegistry, parseBeaconPath, passportDisplayState, validateChallengeInput, validateSubmissionFields } from "./services/presentation.js";
import { V5_RELEASE_PROOF } from "./services/releaseProof.js";

const registry = new BeaconRegistry();
const configured = computed(() => registry.isConfigured());
const route = ref(parseBeaconPath(window.location.pathname));
const assets = ref([]);
const liveCount = ref(0);
const loading = ref(false);
const error = ref("");
const detailAsset = ref(null);
const detailPassport = ref(null);
const historyRows = ref([]);
const challengeRows = ref([]);
const challengeAssetState = ref(null);
const challengePassport = ref(null);
const challengeLoading = ref(false);
const challengeError = ref("");
const writing = ref(false);
const writeError = ref("");
const search = ref("");
const filter = ref("ALL");
const submitStep = ref(1);
const form = reactive(registry.emptySubmission());
const challengeForm = reactive({ category: "", reason: "", evidence_url: "" });
const tx = reactive({ open: false, phase: "", operation: "", hash: "", error: "", recoverable: false });
const recovery = ref(null);
const focusMode = ref(false);
const releaseProof = V5_RELEASE_PROOF;
const proofAsset = computed(() => assets.value.find((item) => item.asset_id === releaseProof.assetId) || assets.value[0] || null);
const proofPassport = computed(() => proofAsset.value?.passport || null);
const categories = CONTRACT_CATEGORIES;
const filterOptions = ["ALL", "CORE", "STANDARD", "WATCH", "REJECT", "EVALUATION_FAILURE"];
const submitSteps = ["IDENTIFY", "OBJECTIVE SOURCES", "SEMANTIC SOURCES", "REVIEW", "BROADCAST"];
const primaryRiskFields = [
  { key: "peg_risk", label: "PEG", provenance: "OBJECTIVE / BOUNDED" },
  { key: "liquidity_risk", label: "LIQUIDITY", provenance: "OBJECTIVE / BOUNDED" },
  { key: "redemption_risk", label: "REDEMPTION", provenance: "SEMANTIC / BOUNDED" },
  { key: "backing_risk", label: "BACKING", provenance: "SEMANTIC / BOUNDED" },
  { key: "admin_governance_risk", label: "GOVERNANCE", provenance: "SEMANTIC / BOUNDED" },
  { key: "security_risk", label: "SECURITY", provenance: "SEMANTIC / BOUNDED" },
  { key: "dependency_risk", label: "DEPENDENCY", provenance: "SEMANTIC / BOUNDED" }
];
const provenanceFields = [
  { key: "issuer_provenance", label: "ISSUER" },
  { key: "redemption_provenance", label: "REDEMPTION" },
  { key: "backing_provenance", label: "BACKING" },
  { key: "security_provenance", label: "SECURITY" },
  { key: "governance_provenance", label: "GOVERNANCE" }
];
const filteredAssets = computed(() => filterRegistry(assets.value, search.value, filter.value));
const formErrors = computed(() => validateSubmissionFields(form, submitStep.value === 4 ? 0 : submitStep.value));
const challengeErrors = computed(() => validateChallengeInput(challengeForm));
const openChallengeCount = computed(() => challengeRows.value.filter((challenge) => challenge.status === "OPEN" && Number(challenge.target_version) === Number(detailPassport.value?.version || 0)).length);
const evidenceSources = computed(() => detailAsset.value ? [
  { label: "ISSUER", url: detailAsset.value.issuer_url, authority: detailPassport.value?.issuer_authority_status, binding: detailPassport.value?.issuer_asset_binding_status },
  { label: "REDEMPTION", url: detailAsset.value.redemption_url, authority: detailPassport.value?.redemption_authority_status, binding: detailPassport.value?.redemption_asset_binding_status },
  { label: "BACKING", url: detailAsset.value.reserve_backing_url, authority: detailPassport.value?.backing_authority_status, binding: detailPassport.value?.backing_asset_binding_status },
  { label: "SECURITY", url: detailAsset.value.security_url, authority: detailPassport.value?.security_authority_status, binding: detailPassport.value?.security_asset_binding_status },
  { label: "GOVERNANCE", url: detailAsset.value.governance_url, authority: detailPassport.value?.governance_authority_status, binding: detailPassport.value?.governance_asset_binding_status }
] : []);

const displayState = (passport) => passportDisplayState(passport);
const navClass = (name) => ({ "nav-active": route.value.name === name });
const openDetail = (id) => navigate(`/assets/${encodeURIComponent(id)}`);

function riskClass(value) {
  return String(value || "unknown").toLowerCase().replaceAll("_", "-");
}

function navigate(path) {
  window.history.pushState({}, "", path);
  syncRoute();
  window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
}

function syncRoute() {
  route.value = parseBeaconPath(window.location.pathname);
  error.value = "";
  writeError.value = "";
  if (["registry", "landing", "proof"].includes(route.value.name)) loadRegistry();
  if (route.value.name === "detail") loadDetail(route.value.assetId);
  if (route.value.name === "challenge") loadChallenge(route.value.assetId);
}

async function loadRegistry() {
  if (!configured.value) return;
  loading.value = true;
  error.value = "";
  try {
    liveCount.value = Number(await registry.assetCount());
    const ids = await registry.assetIds();
    assets.value = await Promise.all(ids.map(async (id) => ({ ...(await registry.asset(id)), passport: await registry.currentPassport(id) })));
  } catch (cause) {
    error.value = cause.message || "Unable to read the Beacon contract.";
  } finally {
    loading.value = false;
  }
}

async function loadDetail(id) {
  if (!configured.value) return;
  loading.value = true;
  error.value = "";
  detailAsset.value = null;
  try {
    const [asset, passport, history, challenges] = await Promise.all([
      registry.asset(id),
      registry.currentPassport(id),
      registry.passportHistory(id),
      registry.challengeRecords(id)
    ]);
    detailAsset.value = Object.keys(asset || {}).length ? asset : null;
    detailPassport.value = passport;
    historyRows.value = Object.values(history || {}).sort((a, b) => Number(a.version) - Number(b.version));
    challengeRows.value = Object.values(challenges || {});
  } catch (cause) {
    error.value = cause.message || "Unable to read the passport.";
  } finally {
    loading.value = false;
  }
}

async function loadChallenge(id) {
  if (!configured.value) return;
  challengeLoading.value = true;
  challengeError.value = "";
  try {
    const [asset, passport] = await Promise.all([registry.asset(id), registry.currentPassport(id)]);
    challengeAssetState.value = Object.keys(asset || {}).length ? asset : null;
    challengePassport.value = passport;
    challengeForm.category = "";
  } catch (cause) {
    challengeError.value = cause.message || "Unable to read the current passport.";
  } finally {
    challengeLoading.value = false;
  }
}

function beginTx(operation) {
  tx.open = true;
  tx.phase = "Preparing";
  tx.operation = operation;
  tx.hash = "";
  tx.error = "";
  tx.recoverable = false;
  writing.value = true;
}

function setRecovery(operation, id, expected) {
  recovery.value = { operation, id, expected };
}

async function finishTx(result, path = "") {
  tx.hash = result.hash || "";
  tx.phase = "State verified";
  tx.recoverable = false;
  writing.value = false;
  if (path) navigate(path);
}

async function runWrite(operation, id, fn, expected, path = "") {
  beginTx(operation);
  setRecovery(operation, id, expected);
  try {
    tx.phase = "Wallet confirmation";
    const result = await fn();
    tx.phase = "Finalized";
    await new Promise((resolve) => setTimeout(resolve, 120));
    await finishTx(result, path);
  } catch (cause) {
    writing.value = false;
    tx.phase = cause?.phase === "reconcile" ? "Check again" : "Unable to complete";
    tx.error = cause.message || "The transaction did not complete; no automatic rebroadcast was attempted.";
    tx.hash = cause.hash || tx.hash;
    tx.recoverable = Boolean(cause.hash || recovery.value);
    writeError.value = tx.error;
  }
}

async function recoverWrite() {
  if (!recovery.value) return;
  tx.phase = "Check again";
  tx.error = "";
  tx.recoverable = false;
  try {
    const result = await registry.recover(recovery.value.operation, recovery.value.id, recovery.value.expected);
    tx.hash = result.hash || tx.hash;
    tx.phase = "State verified";
    if (route.value.name === "detail") await loadDetail(route.value.assetId);
    if (route.value.name === "challenge") await loadChallenge(route.value.assetId);
  } catch (cause) {
    tx.phase = "Check again";
    tx.error = cause.message || "The saved transaction is not finalized successfully yet.";
    tx.recoverable = true;
  }
}

function advanceSubmit() {
  if (formErrors.value.length) return;
  if (submitStep.value < 4) {
    submitStep.value += 1;
    return;
  }
  const id = `${form.chain.toLowerCase()}:${form.token_address.startsWith("0x") ? form.token_address.toLowerCase() : form.token_address}`;
  runWrite("submit_asset", id, () => registry.submitAsset({ ...form }), () => registry.asset(id), `/assets/${encodeURIComponent(id)}`);
  submitStep.value = 5;
}

function evaluateAsset(id) {
  runWrite("evaluate_asset", id, () => registry.evaluateAsset(id), () => registry.currentPassport(id));
}

function submitChallenge() {
  if (challengeErrors.value.length) return;
  const id = route.value.assetId;
  runWrite("challenge_asset", id, () => registry.challengeAsset(id, challengeForm.category, challengeForm.reason, challengeForm.evidence_url), () => registry.asset(id));
}

function reassessAsset(id) {
  runWrite("reassess_asset", id, () => registry.reassessAsset(id), () => registry.currentPassport(id));
}

function handleKeydown(event) {
  if (["INPUT", "TEXTAREA", "SELECT"].includes(event.target?.tagName)) return;
  if (event.key.toLowerCase() === "f" || (event.ctrlKey && event.key === "\\")) {
    event.preventDefault();
    focusMode.value = !focusMode.value;
  }
  if (event.key === "Escape") focusMode.value = false;
}

watch(() => tx.phase, (phase) => {
  if (phase === "State verified") {
    if (["registry", "landing", "proof"].includes(route.value.name)) loadRegistry();
    if (route.value.name === "detail") loadDetail(route.value.assetId);
  }
});

onMounted(() => {
  window.addEventListener("popstate", syncRoute);
  window.addEventListener("keydown", handleKeydown);
  syncRoute();
});

onUnmounted(() => {
  window.removeEventListener("popstate", syncRoute);
  window.removeEventListener("keydown", handleKeydown);
});
</script>
