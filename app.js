(function bootstrap() {
  const data = window.__PROJECT_LOG__;

  if (!data) {
    throw new Error('Project log data is missing.');
  }

  const state = {
    search: '',
    area: 'all',
    author: 'all',
    selectedSha: data.summary.latestCommit ? data.summary.latestCommit.sha : null,
  };

  const dom = {
    repoDescription: document.getElementById('repoDescription'),
    generatedAt: document.getElementById('generatedAt'),
    repoLink: document.getElementById('repoLink'),
    productionLink: document.getElementById('productionLink'),
    repoNote: document.getElementById('repoNote'),
    summaryGrid: document.getElementById('summaryGrid'),
    stackGrid: document.getElementById('stackGrid'),
    languagesTable: document.getElementById('languagesTable'),
    areasTable: document.getElementById('areasTable'),
    activityChart: document.getElementById('activityChart'),
    searchInput: document.getElementById('searchInput'),
    areaSelect: document.getElementById('areaSelect'),
    authorSelect: document.getElementById('authorSelect'),
    visibleCount: document.getElementById('visibleCount'),
    visibleChanges: document.getElementById('visibleChanges'),
    commitList: document.getElementById('commitList'),
    commitDetail: document.getElementById('commitDetail'),
    scriptsTable: document.getElementById('scriptsTable'),
  };

  const dateFormatter = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const dateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatDate(value) {
    return dateFormatter.format(new Date(value));
  }

  function formatDateTime(value) {
    return dateTimeFormatter.format(new Date(value));
  }

  function formatNumber(value) {
    return new Intl.NumberFormat('en-GB').format(value);
  }

  function getMonthLabel(value) {
    return new Intl.DateTimeFormat('en-GB', {
      month: 'long',
      year: 'numeric',
    }).format(new Date(`${value}-01T00:00:00Z`));
  }

  function setHeader() {
    dom.repoDescription.textContent = data.repository.description;
    dom.generatedAt.textContent = `Generated ${formatDateTime(data.generatedAt)}`;

    if (data.repository.url) {
      dom.repoLink.href = data.repository.url;
      dom.repoLink.hidden = false;
    } else {
      dom.repoLink.hidden = true;
    }

    dom.productionLink.href = data.repository.productionUrl;
    dom.repoNote.textContent = data.repository.note;
  }

  function renderSummary() {
    const cards = [
      {
        label: 'Total commits',
        value: formatNumber(data.summary.totalCommits),
        meta: `${data.summary.totalContributors} contributors`,
      },
      {
        label: 'Latest commit',
        value: data.summary.latestCommit ? data.summary.latestCommit.shortSha : 'n/a',
        meta: data.summary.latestCommit ? formatDate(data.summary.latestCommit.authoredAt) : 'n/a',
      },
      {
        label: 'First commit',
        value: data.summary.firstCommit ? data.summary.firstCommit.shortSha : 'n/a',
        meta: data.summary.firstCommit ? formatDate(data.summary.firstCommit.authoredAt) : 'n/a',
      },
      {
        label: 'Largest change',
        value: data.summary.largestCommit ? data.summary.largestCommit.shortSha : 'n/a',
        meta: data.summary.largestCommit
          ? `${formatNumber(data.summary.largestCommit.totalChanges)} changed lines`
          : 'n/a',
      },
    ];

    dom.summaryGrid.innerHTML = cards
      .map(
        (card) => `
          <article class="summary-card">
            <span class="summary-card__label">${escapeHtml(card.label)}</span>
            <strong>${escapeHtml(card.value)}</strong>
            <small>${escapeHtml(card.meta)}</small>
          </article>
        `,
      )
      .join('');
  }

  function renderStack() {
    dom.stackGrid.innerHTML = data.stack
      .map(
        (item) => `
          <article class="tech-badge">
            <div class="tech-badge__icon" style="border-color:${escapeHtml(item.color)}">
              ${escapeHtml(item.shortLabel)}
            </div>
            <div>
              <div class="tech-badge__name">${escapeHtml(item.label)}</div>
              <div class="tech-badge__version">${escapeHtml(item.version)}</div>
            </div>
          </article>
        `,
      )
      .join('');
  }

  function renderSimpleTable(target, rows, valueLabel) {
    target.innerHTML = rows
      .map(
        (row) => `
          <div class="table-row">
            <div class="table-row__label">
              <div class="table-row__title">${escapeHtml(row.label)}</div>
              <div class="table-row__meta">${escapeHtml(row.meta || '')}</div>
            </div>
            <div class="table-row__value">${escapeHtml(valueLabel(row))}</div>
          </div>
        `,
      )
      .join('');
  }

  function renderLanguages() {
    renderSimpleTable(
      dom.languagesTable,
      data.languages.map((item) => ({
        label: item.label,
        meta: item.shortLabel,
        files: item.files,
      })),
      (item) => `${formatNumber(item.files)} files`,
    );
  }

  function renderAreas() {
    renderSimpleTable(
      dom.areasTable,
      data.areas.map((item) => ({
        label: item.label,
        files: item.files,
      })),
      (item) => `${formatNumber(item.files)} files`,
    );
  }

  function renderActivity() {
    const maxCommits = Math.max.apply(
      null,
      data.activity.map((item) => item.commits),
    );

    dom.activityChart.innerHTML = data.activity
      .map((item) => {
        const width = maxCommits ? Math.round((item.commits / maxCommits) * 100) : 0;
        return `
          <div class="activity-row">
            <div class="activity-row__label">${escapeHtml(getMonthLabel(item.month))}</div>
            <div class="activity-row__bar">
              <div class="activity-row__fill" style="width:${width}%"></div>
            </div>
            <div class="activity-row__value">
              ${escapeHtml(`${formatNumber(item.commits)} commits`)}
            </div>
          </div>
        `;
      })
      .join('');
  }

  function renderScripts() {
    renderSimpleTable(
      dom.scriptsTable,
      data.scripts.map((item) => ({
        label: item.name,
        meta: item.command,
      })),
      () => 'npm',
    );
  }

  function buildSelect(select, values, label) {
    select.innerHTML = [
      `<option value="all">${escapeHtml(`All ${label}`)}</option>`,
      ...values.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`),
    ].join('');
  }

  function renderFilters() {
    const areas = Array.from(
      new Set(
        data.commits.flatMap((commit) => commit.dominantAreas),
      ),
    ).sort((left, right) => left.localeCompare(right));

    const authors = Array.from(
      new Set(data.commits.map((commit) => commit.authorName)),
    ).sort((left, right) => left.localeCompare(right));

    buildSelect(dom.areaSelect, areas, 'areas');
    buildSelect(dom.authorSelect, authors, 'authors');
  }

  function getFilteredCommits() {
    const term = state.search.trim().toLowerCase();

    return data.commits.filter((commit) => {
      const matchesArea = state.area === 'all' || commit.dominantAreas.includes(state.area);
      const matchesAuthor = state.author === 'all' || commit.authorName === state.author;

      if (!matchesArea || !matchesAuthor) {
        return false;
      }

      if (!term) {
        return true;
      }

      const haystack = [
        commit.shortSha,
        commit.sha,
        commit.subject,
        commit.body,
        commit.authorName,
        ...commit.files.map((file) => `${file.path} ${file.area}`),
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(term);
    });
  }

  function renderCommitList() {
    const filtered = getFilteredCommits();
    const totalChanges = filtered.reduce((sum, commit) => sum + commit.totalChanges, 0);

    dom.visibleCount.textContent = formatNumber(filtered.length);
    dom.visibleChanges.textContent = formatNumber(totalChanges);

    if (!filtered.some((commit) => commit.sha === state.selectedSha)) {
      state.selectedSha = filtered[0] ? filtered[0].sha : null;
    }

    if (!filtered.length) {
      dom.commitList.innerHTML = '<p class="empty-state">No commit matches the current filters.</p>';
      renderCommitDetail(null);
      return;
    }

    let previousMonth = null;
    const fragments = [];

    for (const commit of filtered) {
      const month = commit.authoredAt.slice(0, 7);

      if (month !== previousMonth) {
        fragments.push(`<div class="month-divider">${escapeHtml(getMonthLabel(month))}</div>`);
        previousMonth = month;
      }

      fragments.push(`
        <button class="commit-item ${commit.sha === state.selectedSha ? 'is-active' : ''}" data-sha="${escapeHtml(commit.sha)}">
          <div class="commit-item__rail">
            <span class="commit-item__dot"></span>
          </div>
          <div>
            <div class="commit-item__top">
              <span class="commit-item__sha">${escapeHtml(commit.shortSha)}</span>
              <span class="commit-item__subject">${escapeHtml(commit.subject)}</span>
            </div>
            <div class="commit-item__meta">
              ${escapeHtml(`${formatDate(commit.authoredAt)} - ${commit.authorName}`)}
            </div>
            <div class="commit-item__areas">
              ${commit.dominantAreas.map((area) => `<span class="tag">${escapeHtml(area)}</span>`).join('')}
            </div>
            <div class="diff-summary">
              <span>${escapeHtml(`${formatNumber(commit.filesChanged)} files`)}</span>
              <span class="diff-summary__plus">${escapeHtml(`+${formatNumber(commit.additions)}`)}</span>
              <span class="diff-summary__minus">${escapeHtml(`-${formatNumber(commit.deletions)}`)}</span>
            </div>
          </div>
        </button>
      `);
    }

    dom.commitList.innerHTML = fragments.join('');

    dom.commitList.querySelectorAll('.commit-item').forEach((button) => {
      button.addEventListener('click', () => {
        state.selectedSha = button.getAttribute('data-sha');
        renderCommitList();
      });
    });

    renderCommitDetail(filtered.find((commit) => commit.sha === state.selectedSha) || null);
  }

  function renderCommitDetail(commit) {
    if (!commit) {
      dom.commitDetail.innerHTML = '<p class="empty-state">Select a commit from the timeline.</p>';
      return;
    }

    const body = commit.body
      ? `<p class="detail__body">${escapeHtml(commit.body)}</p>`
      : '<p class="detail__body">No extra commit description for this entry.</p>';

    const filesRows = commit.files
      .map(
        (file) => `
          <tr>
            <td>
              <code class="file-path">${escapeHtml(file.path)}</code>
              ${
                file.previousPath
                  ? `<span class="file-path__previous">from ${escapeHtml(file.previousPath)}</span>`
                  : ''
              }
            </td>
            <td class="diff-summary__plus">${escapeHtml(`+${formatNumber(file.additions)}`)}</td>
            <td class="diff-summary__minus">${escapeHtml(`-${formatNumber(file.deletions)}`)}</td>
            <td>${escapeHtml(formatNumber(file.changes))}</td>
          </tr>
        `,
      )
      .join('');

    const links = [commit.commitUrl, commit.compareUrl].filter(Boolean);
    const linksMarkup = links.length
      ? `
          <div class="detail__links">
            ${commit.commitUrl
              ? `<a class="detail__link" href="${escapeHtml(commit.commitUrl)}" target="_blank" rel="noreferrer">Commit page</a>`
              : ''}
            ${commit.compareUrl
              ? `<a class="detail__link" href="${escapeHtml(commit.compareUrl)}" target="_blank" rel="noreferrer">Compare with parent</a>`
              : ''}
          </div>
        `
      : '<p class="panel__meta">Source commit pages remain private for this project.</p>';

    dom.commitDetail.innerHTML = `
      <section class="detail__section">
        <div class="detail__header">
          <div>
            <div class="detail__sha">${escapeHtml(commit.sha)}</div>
            <h3 class="detail__title">${escapeHtml(commit.subject)}</h3>
            <p class="panel__meta">${escapeHtml(`${formatDateTime(commit.authoredAt)} - ${commit.authorName}`)}</p>
          </div>
          ${linksMarkup}
        </div>
        ${body}
      </section>
      <section class="detail__section">
        <div class="detail__grid">
          <div class="detail__metric">
            <label>Files touched</label>
            <strong>${escapeHtml(formatNumber(commit.filesChanged))}</strong>
          </div>
          <div class="detail__metric">
            <label>Lines added</label>
            <strong class="diff-summary__plus">${escapeHtml(formatNumber(commit.additions))}</strong>
          </div>
          <div class="detail__metric">
            <label>Lines removed</label>
            <strong class="diff-summary__minus">${escapeHtml(formatNumber(commit.deletions))}</strong>
          </div>
          <div class="detail__metric">
            <label>Change volume</label>
            <strong>${escapeHtml(formatNumber(commit.totalChanges))}</strong>
          </div>
        </div>
      </section>
      <section class="detail__section">
        <div class="panel__header" style="padding:0 0 14px;border:0">
          <h2>Per-file counts</h2>
          <p class="panel__meta">Simple diff stats only, without exposing patch content.</p>
        </div>
        <table class="files-table">
          <thead>
            <tr>
              <th>Path</th>
              <th>Added</th>
              <th>Removed</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>${filesRows}</tbody>
        </table>
      </section>
    `;
  }

  function bindEvents() {
    dom.searchInput.addEventListener('input', (event) => {
      state.search = event.target.value;
      renderCommitList();
    });

    dom.areaSelect.addEventListener('change', (event) => {
      state.area = event.target.value;
      renderCommitList();
    });

    dom.authorSelect.addEventListener('change', (event) => {
      state.author = event.target.value;
      renderCommitList();
    });
  }

  function init() {
    setHeader();
    renderSummary();
    renderStack();
    renderLanguages();
    renderAreas();
    renderActivity();
    renderScripts();
    renderFilters();
    bindEvents();
    renderCommitList();
  }

  init();
})();
