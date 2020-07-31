const getters = {
    sidebar: state => state.app.sidebar,
    avatar: state => state.user.avatar,
    name: state => state.user.name,
    roles: state => state.menu.roles,
    permission_routes: state => state.permission.routes,
}
export default getters
