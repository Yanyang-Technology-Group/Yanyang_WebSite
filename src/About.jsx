function About() {
  return (
    <>
      <div className="about-hero">
        <h1>关于晏阳</h1>
        <p>一个以城市建设与轨道交通为核心的 Minecraft 创作社群，汇聚来自多地的爱好者共同筑梦。</p>
      </div>

      <div className="about-content">
        <div className="about-card">
          <h2>🏗️ 我们是谁</h2>
          <p>
            晏阳城市建设 × 晏阳轨道交通是一个以 Minecraft Java Edition 1.20.1 和 Minecraft Transit Railway 4 为核心，集城市建设和轨道交通为一体的 Minecraft 服务器。
          </p>
          <p>
            成立于 2022 年 7 月 16 日，至今已汇聚 52 名成员，涵盖城市规划、建筑设计、轨道交通、运营维护等多个领域的爱好者。
          </p>
          <div className="highlights-grid">
            <div className="highlight-item">
              <div className="highlight-number">2022</div>
              <div className="highlight-label">成立年份</div>
            </div>
            <div className="highlight-item">
              <div className="highlight-number">52</div>
              <div className="highlight-label">社群成员</div>
            </div>
            <div className="highlight-item">
              <div className="highlight-number">4年+</div>
              <div className="highlight-label">持续运营</div>
            </div>
          </div>
        </div>

        <div className="about-card">
          <h2>🚇 轨道交通</h2>
          <p>
            作为服务器的核心灵魂，晏阳轨道交通已建成覆盖全域的一体化公共交通网络。截至目前，已开通运营 19 条地铁线路，建成换乘枢纽 7 座，实现了市区 20 分钟出行圈。
          </p>
        </div>

        <div className="about-card">
          <h2>🌟 社群理念</h2>
          <p>
            我们始终秉持开放、包容、共创的社群理念。晏阳从不是少数人的创作秀场，而是每一位爱好者都能施展才华的平台。无论你是建筑大佬还是造城新手，都能在这里找到属于自己的位置。
          </p>
        </div>

        <div className="about-card">
          <h2>🔮 未来展望</h2>
          <p>
            未来，晏阳将继续推进城市南拓及西拓片区、新城市的开发建设，完善城市功能配套，打造更多兼具设计感与辨识度的城市地标。同时持续深化轨道交通线网的优化升级，推进市域铁路网、城际铁路的建设，打造更具真实感、更丰富多元的轨交出行体验。
          </p>
        </div>
      </div>

      <section className="partners-section">
        <div className="section-header">
          <h2>合作伙伴</h2>
          <p>感谢以下伙伴的支持与合作</p>
        </div>
        <div className="partners-grid">
          <div className="partner-card">
            <img src="/us/1.png" alt="合作伙伴" loading="lazy" />
          </div>
          <div className="partner-card">
            <img src="/us/2.png" alt="合作伙伴" loading="lazy" />
          </div>
          <div className="partner-card">
            <img src="/us/3.png" alt="合作伙伴" loading="lazy" />
          </div>
          <div className="partner-card">
            <img src="/us/4.png" alt="合作伙伴" loading="lazy" />
          </div>
          <div className="partner-card">
            <img src="/us/5.png" alt="合作伙伴" loading="lazy" />
          </div>
        </div>
      </section>
    </>
  )
}

export default About
