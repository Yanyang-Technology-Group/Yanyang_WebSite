function Join() {
  return (
    <div className="join-page">
      <div className="join-hero">
        <h1>加入晏阳</h1>
        <p>在 Minecraft 里亲手搭建梦想都市，与志同道合的伙伴一起创造属于你的城市传奇。</p>
      </div>

      <div className="join-steps">
        <div className="step-card">
          <div className="step-number">1</div>
          <h3>加入QQ群</h3>
          <p>通过下方按钮加入我们的QQ交流群，与管理员取得联系。</p>
        </div>
        <div className="step-card">
          <div className="step-number">2</div>
          <h3>提交申请</h3>
          <p>在群内阅读入服须知，按要求填写入服申请表。</p>
        </div>
        <div className="step-card">
          <div className="step-number">3</div>
          <h3>开始创作</h3>
          <p>审核通过后即可进入服务器，开启你的城市建设之旅。</p>
        </div>
      </div>

      <div className="join-cta">
        <a
          href="https://qm.qq.com/q/aBSDTnmJhK"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-join"
        >
          加入 QQ 群聊 →
        </a>
      </div>

      <div className="server-info">
        <h2>服务器信息</h2>
        <div className="info-grid">
          <div className="info-item">
            <div className="info-icon">🎮</div>
            <div className="info-text">
              <span className="info-label">游戏版本</span>
              <span className="info-value">Java Edition 1.20.1</span>
            </div>
          </div>
          <div className="info-item">
            <div className="info-icon">⚙️</div>
            <div className="info-text">
              <span className="info-label">核心框架</span>
              <span className="info-value">Fabric + MTR 4</span>
            </div>
          </div>
          <div className="info-item">
            <div className="info-icon">👥</div>
            <div className="info-text">
              <span className="info-label">QQ 群号</span>
              <span className="info-value">486029013</span>
            </div>
          </div>
          <div className="info-item">
            <div className="info-icon">📧</div>
            <div className="info-text">
              <span className="info-label">反馈邮箱</span>
              <span className="info-value">feedback@yanyn.cn</span>
            </div>
          </div>
        </div>
      </div>

      <div className="server-info">
        <h2>硬件配置</h2>
        <div className="info-grid">
          <div className="info-item">
            <div className="info-icon">🖥️</div>
            <div className="info-text">
              <span className="info-label">处理器</span>
              <span className="info-value">E5-2698B V3 16C32T</span>
            </div>
          </div>
          <div className="info-item">
            <div className="info-icon">💾</div>
            <div className="info-text">
              <span className="info-label">内存</span>
              <span className="info-value">32GB DDR3 1866MHz</span>
            </div>
          </div>
          <div className="info-item">
            <div className="info-icon">💿</div>
            <div className="info-text">
              <span className="info-label">存储</span>
              <span className="info-value">512GB M.2 NVMe SSD</span>
            </div>
          </div>
          <div className="info-item">
            <div className="info-icon">🌐</div>
            <div className="info-text">
              <span className="info-label">网络带宽</span>
              <span className="info-value">1000M↓ / 80M↑</span>
            </div>
          </div>
        </div>
      </div>

      <div className="faq-section">
        <div className="section-header">
          <h2>常见问题</h2>
        </div>
        <div className="faq-item">
          <h3>需要正版 Minecraft 才能加入吗？</h3>
          <p>不需要，服务器支持离线登录，没有正版也可以加入游玩。</p>
        </div>
        <div className="faq-item">
          <h3>对建筑水平有要求吗？</h3>
          <p>没有硬性要求！无论你是建筑大佬还是新手，只要热爱城市建设，都欢迎加入。社群内有经验丰富的玩家可以提供指导。</p>
        </div>
        <div className="faq-item">
          <h3>服务器有哪些规则？</h3>
          <p>主要包括：禁止使用外挂/熊服、尊重他人建筑作品、遵守城市规划布局等。详细规则将在QQ群内公布。</p>
        </div>
        <div className="faq-item">
          <h3>审核需要多长时间？</h3>
          <p>通常管理员会在 24 小时内处理你的入服申请，高峰期可能稍有延迟。</p>
        </div>
      </div>
    </div>
  )
}

export default Join
