import { Card, Button, Steps, Collapse, Row, Col, Tooltip, MessagePlugin } from 'tdesign-react'
import {
  ChatIcon,
  FileIcon,
  PlayIcon,
  DesktopIcon,
  SettingIcon,
  UserIcon,
  MailIcon,
  ServerIcon,
  CpuIcon,
  HardDriveIcon,
  WifiIcon,
  HelpCircleIcon,
  FileCopyIcon,
} from 'tdesign-icons-react'
import { RevealSection } from './App.jsx'

const { StepItem } = Steps
const { Panel: CollapsePanel } = Collapse

function copyToClipboard(text, label) {
  navigator.clipboard.writeText(text).then(
    () => MessagePlugin.success(`已复制${label}: ${text}`),
    () => MessagePlugin.warning('复制失败，请手动复制')
  )
}

function Join() {
  return (
    <div className="join-page">
      <div className="page-hero page-hero--gradient">
        <h1>加入晏阳</h1>
        <p>在 Minecraft 里亲手搭建梦想都市，与志同道合的伙伴一起创造属于你的城市传奇。</p>
      </div>

      <div className="page-content">
        <RevealSection>
          <Card className="steps-card">
            <Steps current={-1} layout="vertical">
              <StepItem
                title="加入 QQ 群"
                content="通过下方按钮加入我们的QQ交流群，与管理员取得联系。"
                icon={<ChatIcon />}
              />
              <StepItem
                title="提交申请"
                content="在群内阅读入服须知，按要求填写入服申请表。"
                icon={<FileIcon />}
              />
              <StepItem
                title="开始创作"
                content="审核通过后即可进入服务器，开启你的城市建设之旅。"
                icon={<PlayIcon />}
              />
            </Steps>
          </Card>
        </RevealSection>

        <div className="join-cta">
          <a
            href="https://qm.qq.com/q/aBSDTnmJhK"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button theme="primary" size="large" shape="round" icon={<ChatIcon />}>
              加入 QQ 群聊
            </Button>
          </a>
        </div>

        <RevealSection delay={80}>
          <Card title="服务器信息" className="info-card" hoverShadow bordered>
            <Row gutter={[16, 16]}>
              <Col xs={12} sm={6}>
                <Tooltip content="Minecraft Java 版 1.20.1">
                  <div className="info-item">
                    <DesktopIcon size="20px" className="info-icon" />
                    <div className="info-text">
                      <span className="info-label">游戏版本</span>
                      <span className="info-value">Java Edition 1.20.1</span>
                    </div>
                  </div>
                </Tooltip>
              </Col>
              <Col xs={12} sm={6}>
                <Tooltip content="基于 Fabric 模组加载器 + MTR 4 铁路模组">
                  <div className="info-item">
                    <SettingIcon size="20px" className="info-icon" />
                    <div className="info-text">
                      <span className="info-label">核心框架</span>
                      <span className="info-value">Fabric + MTR 4</span>
                    </div>
                  </div>
                </Tooltip>
              </Col>
              <Col xs={12} sm={6}>
                <Tooltip content="点击复制群号">
                  <div className="info-item info-item--copyable" onClick={() => copyToClipboard('486029013', 'QQ群号')}>
                    <UserIcon size="20px" className="info-icon" />
                    <div className="info-text">
                      <span className="info-label">QQ 群号</span>
                      <span className="info-value">486029013</span>
                    </div>
                    <FileCopyIcon size="14px" className="copy-hint" />
                  </div>
                </Tooltip>
              </Col>
              <Col xs={12} sm={6}>
                <Tooltip content="点击复制邮箱">
                  <div className="info-item info-item--copyable" onClick={() => copyToClipboard('feedback@yanyn.cn', '邮箱')}>
                    <MailIcon size="20px" className="info-icon" />
                    <div className="info-text">
                      <span className="info-label">反馈邮箱</span>
                      <span className="info-value">feedback@yanyn.cn</span>
                    </div>
                    <FileCopyIcon size="14px" className="copy-hint" />
                  </div>
                </Tooltip>
              </Col>
            </Row>
          </Card>
        </RevealSection>

        <RevealSection delay={160}>
          <Card title="硬件配置" className="info-card" hoverShadow bordered>
            <Row gutter={[16, 16]}>
              <Col xs={12} sm={6}>
                <Tooltip content="Intel Xeon E5-2698B V3, 16核32线程">
                  <div className="info-item">
                    <ServerIcon size="20px" className="info-icon" />
                    <div className="info-text">
                      <span className="info-label">处理器</span>
                      <span className="info-value">E5-2698B V3 16C32T</span>
                    </div>
                  </div>
                </Tooltip>
              </Col>
              <Col xs={12} sm={6}>
                <Tooltip content="32GB DDR3 内存，主频 1866MHz">
                  <div className="info-item">
                    <CpuIcon size="20px" className="info-icon" />
                    <div className="info-text">
                      <span className="info-label">内存</span>
                      <span className="info-value">32GB DDR3 1866MHz</span>
                    </div>
                  </div>
                </Tooltip>
              </Col>
              <Col xs={12} sm={6}>
                <Tooltip content="512GB NVMe 固态硬盘">
                  <div className="info-item">
                    <HardDriveIcon size="20px" className="info-icon" />
                    <div className="info-text">
                      <span className="info-label">存储</span>
                      <span className="info-value">512GB M.2 NVMe SSD</span>
                    </div>
                  </div>
                </Tooltip>
              </Col>
              <Col xs={12} sm={6}>
                <Tooltip content="下行 1000Mbps / 上行 80Mbps">
                  <div className="info-item">
                    <WifiIcon size="20px" className="info-icon" />
                    <div className="info-text">
                      <span className="info-label">网络带宽</span>
                      <span className="info-value">1000M↓ / 80M↑</span>
                    </div>
                  </div>
                </Tooltip>
              </Col>
            </Row>
          </Card>
        </RevealSection>

        <RevealSection delay={240}>
          <Card className="faq-card" hoverShadow>
            <div className="section-header" style={{ marginBottom: '1.5rem' }}>
              <h2><HelpCircleIcon style={{ marginRight: '8px' }} />常见问题</h2>
            </div>
            <Collapse expandIconPlacement="right" borderless>
              <CollapsePanel header="需要正版 Minecraft 才能加入吗？" value="1">
                不需要，服务器支持离线登录，没有正版也可以加入游玩。
              </CollapsePanel>
              <CollapsePanel header="对建筑水平有要求吗？" value="2">
                没有硬性要求！无论你是建筑大佬还是新手，只要热爱城市建设，都欢迎加入。社群内有经验丰富的玩家可以提供指导。
              </CollapsePanel>
              <CollapsePanel header="服务器有哪些规则？" value="3">
                主要包括：禁止使用外挂/熊服、尊重他人建筑作品、遵守城市规划布局等。详细规则将在QQ群内公布。
              </CollapsePanel>
              <CollapsePanel header="审核需要多长时间？" value="4">
                通常管理员会在 24 小时内处理你的入服申请，高峰期可能稍有延迟。
              </CollapsePanel>
            </Collapse>
          </Card>
        </RevealSection>
      </div>
    </div>
  )
}

export default Join
